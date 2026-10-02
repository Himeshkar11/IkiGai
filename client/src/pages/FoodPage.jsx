import React, { useEffect, useState } from 'react';
import { useDate } from '../context/DateContext';
import * as foodService from '../services/foodService';
import { addDaysToDate, formatCalendarDisplay, getLogicalToday } from '../utils/activity';

import { FoodIcon, RefreshCwIcon, DatabaseIcon } from '../components/Icons';
import nutritionService from '../services/nutritionService';

const meals = [
  { key: 'breakfast', label: 'Breakfast', tag: 'Morning' },
  { key: 'morningSnack', label: 'Morning Snack', tag: 'Snack' },
  { key: 'lunch', label: 'Lunch', tag: 'Midday' },
  { key: 'eveningSnack', label: 'Evening Snack', tag: 'Snack' },
  { key: 'dinner', label: 'Dinner', tag: 'Evening' },
];

const statFields = [
  { key: 'calories', label: 'Calories', unit: 'kcal' },
  { key: 'protein', label: 'Protein', unit: 'g' },
  { key: 'carbs', label: 'Carbs', unit: 'g' },
  { key: 'fat', label: 'Fat', unit: 'g' },
  { key: 'fiber', label: 'Fiber', unit: 'g' },
];

const calculateFoodTotals = (foodLog) => {
  const totals = {
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    fiber: 0,
  };

  if (!foodLog?.meals) {
    return totals;
  }

  Object.values(foodLog.meals).forEach((mealItems) => {
    if (!Array.isArray(mealItems)) {
      return;
    }

    mealItems.forEach((item) => {
      totals.calories += Number(item.calories) || 0;
      totals.protein += Number(item.protein) || 0;
      totals.carbs += Number(item.carbs) || 0;
      totals.fat += Number(item.fat) || 0;
      totals.fiber += Number(item.fiber) || 0;
    });
  });

  return totals;
};

// ---- Inline "Add Food" form. Defined at module scope so its identity is
// stable across FoodPage re-renders (keeps focus in the textarea/select). ----
const AddFoodForm = ({
  meal,
  onMealChange,
  description,
  onDescriptionChange,
  onCancel,
  onSubmit,
  submitting,
  aiAnalyzing,
  aiPreview,
  onConfirmAI,
  onCancelAI,
  onRefreshAI,
}) => (
  <form className="add-food-form" onSubmit={onSubmit}>
    <div className="add-food-head">
      <h3>Add Food</h3>
      <span className="add-food-subhead">Estimate calories & protein</span>
    </div>

    <label className="field">
      <span className="field-label">Meal</span>

      <select
        value={meal}
        onChange={(e) => onMealChange(e.target.value)}
        disabled={aiAnalyzing || submitting}
      >
        {meals.map((m) => (
          <option key={m.key} value={m.key}>
            {m.label} ({m.tag})
          </option>
        ))}
      </select>
    </label>

    {!aiPreview ? (
      <>
        <label className="field">
          <span className="field-label">What did you eat?</span>

          <textarea
            rows={2}
            placeholder="e.g. 2 rotis, 1 cup dal, 100g paneer"
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value)}
            autoFocus
            disabled={aiAnalyzing}
          />
        </label>

        <div className="form-actions">
          <button
            type="button"
            className="link"
            onClick={onCancel}
            disabled={aiAnalyzing}
          >
            Cancel
          </button>

          <button
            type="submit"
            className="btn primary"
            disabled={aiAnalyzing || !description.trim()}
          >
            {aiAnalyzing ? 'Analyzing…' : 'Estimate Nutrition'}
          </button>
        </div>
      </>
    ) : (
      <div className="ai-food-preview">
        <div className="ai-preview-header">
          <div className="ai-preview-title-wrap">
            <h4>Estimated Nutrition</h4>
            {aiPreview.source && (
              <span
                className="cache-pill"
                title={
                  aiPreview.source === 'seed'
                    ? 'Tier 1: Retrieved from local Indian staples database'
                    : aiPreview.source === 'client-cache'
                    ? 'Tier 1: Retrieved from client IndexedDB cache'
                    : aiPreview.source === 'server-cache'
                    ? 'Tier 2: Retrieved from server-side MongoDB cache'
                    : 'Tier 3: Fresh estimation from AI'
                }
              >
                <span className="cache-pill-dot" />{' '}
                {aiPreview.source === 'seed'
                  ? 'Instant • Seed'
                  : aiPreview.source === 'client-cache'
                  ? 'Instant • Client Cache'
                  : aiPreview.source === 'server-cache'
                  ? 'Server Cache'
                  : 'AI Estimate'}
              </span>
            )}
          </div>

          <button
            type="button"
            className="btn-refresh-cache"
            onClick={onRefreshAI}
            disabled={aiAnalyzing}
            title="Bypass cache and get a fresh calculation from AI"
          >
            <RefreshCwIcon size={12} className={aiAnalyzing ? 'spin' : ''} />
            <span>{aiAnalyzing ? 'Re-fetching…' : 'Refresh from AI'}</span>
          </button>
        </div>

        {aiPreview.isFallback && (
          <div className="ai-fallback-notice">
            <span>{aiPreview.fallbackNote}</span>
          </div>
        )}

        <p className="muted" style={{ fontSize: '11.5px', margin: '4px 0 10px' }}>
          Approximate nutritional values. Edit portions as needed after adding.
        </p>

        {aiPreview.items?.length > 0 ? (
          <div className="ai-food-items">
            {aiPreview.items.map((item, index) => {
              const nutrition = item.nutrition || {};

              return (
                <div className="ai-food-item" key={`${item.name}-${index}`}>
                  <div className="ai-item-left">
                    <strong className="ai-item-name">{item.name}</strong>
                    <div className="ai-item-qty">
                      {item.quantity} {item.unit}
                    </div>
                  </div>

                  <div className="ai-food-nutrition">
                    <div className="ai-item-cal">
                      <strong>{Math.round(Number(nutrition.calories) || 0)}</strong>
                      <span> kcal</span>
                    </div>

                    <div className="ai-item-macros">
                      <span>P: {Math.round(Number(nutrition.protein) || 0)}g</span>
                      <span>·</span>
                      <span>C: {Math.round(Number(nutrition.carbs) || 0)}g</span>
                      <span>·</span>
                      <span>F: {Math.round(Number(nutrition.fat) || 0)}g</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="muted">
            No food items were detected. Try describing what you ate with quantities.
          </p>
        )}

        <div className="form-actions" style={{ marginTop: '14px' }}>
          <button
            type="button"
            className="link"
            onClick={onCancelAI}
            disabled={submitting}
          >
            Back
          </button>

          <button
            type="button"
            className="btn primary"
            onClick={onConfirmAI}
            disabled={submitting || !aiPreview.items?.length}
          >
            {submitting ? 'Adding…' : 'Confirm & Add to Log'}
          </button>
        </div>
      </div>
    )}
  </form>
);

// ---- One logged food entry, with a small overflow menu for edit/delete. ----
const FoodEntryRow = ({
  item,
  icon,
  editing,
  editQty,
  onEditQtyChange,
  menuOpen,
  onToggleMenu,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onDelete,
}) => (
  <li className="food-entry">
    <div className="food-entry-main">
      <span className="food-entry-icon" aria-hidden>{icon}</span>
      <div className="food-entry-body">
        <div className="food-entry-name">
          {item.description || item.name || 'Food'}
        </div>

        {editing ? (
          <div className="food-entry-edit">
            <span className="muted">Servings</span>

            <input
              type="number"
              min="0.25"
              step="0.25"
              value={editQty}
              onChange={(e) => onEditQtyChange(Number(e.target.value))}
              autoFocus
            />

            <button
              type="button"
              className="link"
              onClick={onCancelEdit}
            >
              Cancel
            </button>

            <button
              type="button"
              className="btn primary small"
              onClick={onSaveEdit}
            >
              Save
            </button>
          </div>
        ) : (
          <div className="food-entry-meta">
            Protein {Math.round(item.protein || 0)}g · Carbs{' '}
            {Math.round(item.carbs || 0)}g · Fat{' '}
            {Math.round(item.fat || 0)}g
          </div>
        )}
      </div>
    </div>

    {!editing && (
      <div className="food-entry-actions">
        <button
          type="button"
          className="icon-menu-btn"
          aria-label="Entry options"
          onClick={onToggleMenu}
        >
          ⋮
        </button>

        {menuOpen && (
          <div className="entry-menu">
            <button type="button" onClick={onStartEdit}>
              Edit
            </button>

            <button
              type="button"
              className="danger"
              onClick={onDelete}
            >
              Delete
            </button>
          </div>
        )}
      </div>
    )}
  </li>
);

const FoodPage = () => {
  const { selectedDate, setSelectedDate } = useDate();

  const [foodLog, setFoodLog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Which "Add Food" form is open: null (closed), 'global', or a meal key.
  const [formOpenFor, setFormOpenFor] = useState(null);
  const [formMeal, setFormMeal] = useState('breakfast');
  const [formDescription, setFormDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [aiPreview, setAiPreview] = useState(null);

  // Per-entry overflow menu / inline quantity edit.
  const [openMenuItemId, setOpenMenuItemId] = useState(null);
  const [editingItemId, setEditingItemId] = useState(null);
  const fetchLog = async (date) => {
    setLoading(true);
    setError(null);

    try {
      const res = await foodService.getFoodLogByDate(date);
      setFoodLog(res.foodLog || { meals: {} });
    } catch (_e) {
      setError('Failed to load food log');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLog(selectedDate);
    setFormOpenFor(null);
    setOpenMenuItemId(null);
    setEditingItemId(null);
  }, [selectedDate]);

  const openForm = (mealKey) => {
    setFormMeal(mealKey || 'breakfast');
    setFormDescription('');
    setFormOpenFor(mealKey || 'global');
    setOpenMenuItemId(null);
  };

  const closeForm = () => {
    setFormOpenFor(null);
    setFormDescription('');
    setAiPreview(null);
  };

  const handleSubmitAdd = async (e) => {
    e.preventDefault();

    const description = formDescription.trim();

    if (!description) return;

    setAiAnalyzing(true);
    setError(null);

    try {
      const result = await foodService.analyzeFood(description);

      setAiPreview(result);
    } catch (e) {
      console.error('AI food analysis failed:', e);

      setError(
        e.response?.data?.message || 'Failed to analyze food'
      );
    } finally {
      setAiAnalyzing(false);
    }
  };

  const handleRefreshAI = async () => {
    const description = formDescription.trim();
    if (!description) return;

    setAiAnalyzing(true);
    setError(null);

    try {
      const result = await foodService.analyzeFood(description, { bypassCache: true });
      setAiPreview(result);
    } catch (e) {
      console.error('Refresh AI food analysis failed:', e);
      setError(e.response?.data?.message || 'Failed to refresh from AI');
    } finally {
      setAiAnalyzing(false);
    }
  };

  const [cacheNotice, setCacheNotice] = useState(null);
  const handleClearCache = async () => {
    await nutritionService.clearCache();
    setCacheNotice('Nutrition cache cleared!');
    setTimeout(() => setCacheNotice(null), 2500);
  };

  const handleConfirmAI = async () => {
    if (!aiPreview?.items?.length) {
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      let updatedLog = foodLog;

      for (const item of aiPreview.items) {
        const payload = {
          description: item.name,
          quantity: item.quantity,
          calories: item.nutrition.calories,
          protein: item.nutrition.protein,
          carbs: item.nutrition.carbs,
          fat: item.nutrition.fat,
          fiber: item.nutrition.fiber,
        };

        updatedLog = await foodService.addItemToMeal(
          selectedDate,
          formMeal,
          payload
        );
      }

      setFoodLog(updatedLog);

      setAiPreview(null);
      setFormDescription('');
      closeForm();
    } catch (e) {
      console.error('Failed to save AI foods:', e);

      setError(
        e.response?.data?.message ||
        'Failed to add analyzed food'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelAI = () => {
    setAiPreview(null);
  };

  const handleDelete = async (item, meal) => {
    if (!foodLog?._id) return;

    setOpenMenuItemId(null);

    try {
      const updated = await foodService.deleteMealItem(
        foodLog._id,
        meal,
        item._id
      );

      setFoodLog(updated);
    } catch (_e) {
      setError('Failed to remove item');
    }
  };

  const startEdit = (item) => {
    setEditingItemId(item._id);
    setEditQty(item.quantity || 1);
    setOpenMenuItemId(null);
  };

  const saveEdit = async (item, meal) => {
    if (!foodLog?._id) return;

    try {
      const updated = await foodService.updateMealItem(
        foodLog._id,
        meal,
        item._id,
        { quantity: editQty }
      );

      setFoodLog(updated);
    } catch (_e) {
      setError('Failed to update entry');
    } finally {
      setEditingItemId(null);
    }
  };

  const navDay = (delta) => {
    const nextDate = addDaysToDate(selectedDate, delta);
    if (nextDate) setSelectedDate(nextDate);
  };

  const totals = calculateFoodTotals(foodLog);

  const displayDate = formatCalendarDisplay(selectedDate, {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const renderForm = () => (
    <AddFoodForm
      meal={formMeal}
      onMealChange={setFormMeal}
      description={formDescription}
      onDescriptionChange={setFormDescription}
      onCancel={closeForm}
      onSubmit={handleSubmitAdd}
      submitting={submitting}
      aiAnalyzing={aiAnalyzing}
      aiPreview={aiPreview}
      onConfirmAI={handleConfirmAI}
      onCancelAI={handleCancelAI}
      onRefreshAI={handleRefreshAI}
    />
  );

  const cacheStats = nutritionService.getStats();

  return (
    <div className="page-card food-page">
      <div className="page-head">
        <div>
          <p className="eyebrow">Nutrition & Macros</p>
          <h1>Food Journal</h1>
          <div className="food-date">{displayDate}</div>
        </div>

        <div className="food-page-actions">
          <button
            type="button"
            className="ghost-btn data-cache-btn"
            onClick={handleClearCache}
            title="Clear AI Nutrition Cache"
          >
            <DatabaseIcon size={13} />
            <span>Clear Cache</span>
          </button>
        </div>
      </div>

      {cacheNotice && (
        <div className="cache-notice-banner" role="status">
          <DatabaseIcon size={14} />
          <span>{cacheNotice} (Hits: {cacheStats.hits}, Saved API calls: {cacheStats.savedApiCalls})</span>
        </div>
      )}

      <div className="date-nav">
        <button
          className="link-subtle"
          onClick={() => navDay(-1)}
        >
          ← Previous
        </button>

        <button
          className="btn"
          onClick={() => setSelectedDate(getLogicalToday())}
        >
          Today
        </button>

        <button
          className="link-subtle"
          onClick={() => navDay(1)}
        >
          Next →
        </button>
      </div>

      <div className="food-section">
        <h4 className="section-title">Daily Nutrition Summary</h4>

        <div className="nutrition-stats">
          {statFields.map((f) => (
            <div
              key={f.key}
              className="nutrition-stat"
            >
              <div className="nutrition-stat-value">
                {Math.round(totals[f.key] || 0)}
                {f.unit === 'g' ? 'g' : ''}
              </div>

              <div className="nutrition-stat-label">
                {f.label}
                {f.unit === 'kcal' ? ' (kcal)' : ''}
              </div>
            </div>
          ))}
        </div>
      </div>

      {error && (
        <div className="card error">
          {error}
        </div>
      )}

      {loading ? (
        <div className="card loading-card">
          <div className="skeleton-line" style={{ width: '120px', height: '16px', marginBottom: '8px' }} />
          <div className="skeleton-line" style={{ height: '38px' }} />
        </div>
      ) : (
        <>
          <div className="food-section add-food-section">
            {formOpenFor === 'global' ? (
              renderForm(null)
            ) : (
              <button
                className="add-food-cta"
                onClick={() => openForm(null)}
              >
                + Add Food Item
              </button>
            )}
          </div>

          <div className="meal-list">
            {meals.map((m) => {
              const items =
                (foodLog &&
                  foodLog.meals &&
                  foodLog.meals[m.key]) ||
                [];

              const formOpenHere =
                formOpenFor === m.key;

              return (
                <div
                  key={m.key}
                  className="meal-card-v2"
                >
                  <div className="meal-card-header">
                    <h3>
                      <span className="meal-tag-dot" aria-hidden="true" />
                      <span>{m.label}</span>
                      <span className="meal-time-tag">{m.tag}</span>
                    </h3>

                    {!formOpenHere && (
                      <button
                        className="add-mini"
                        onClick={() =>
                          openForm(m.key)
                        }
                      >
                        + Add
                      </button>
                    )}
                  </div>

                  {formOpenHere &&
                    renderForm(m.key)}

                  {items.length === 0 ? (
                    <div className="meal-empty">
                      No food logged yet
                    </div>
                  ) : (
                    <ul className="food-entries">
                      {items.map((it) => (
                        <FoodEntryRow
                          key={it._id}
                          item={it}
                          icon={<FoodIcon size={14} />}
                          editing={
                            editingItemId === it._id
                          }
                          editQty={editQty}
                          onEditQtyChange={setEditQty}
                          menuOpen={
                            openMenuItemId === it._id
                          }
                          onToggleMenu={() =>
                            setOpenMenuItemId(
                              (prev) =>
                                prev === it._id
                                  ? null
                                  : it._id
                            )
                          }
                          onStartEdit={() =>
                            startEdit(it)
                          }
                          onCancelEdit={() =>
                            setEditingItemId(null)
                          }
                          onSaveEdit={() =>
                            saveEdit(it, m.key)
                          }
                          onDelete={() =>
                            handleDelete(it, m.key)
                          }
                        />
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

export default FoodPage;