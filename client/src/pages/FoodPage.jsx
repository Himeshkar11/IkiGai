import React, { useEffect, useState } from 'react';
import { useDate } from '../context/DateContext';
import * as foodService from '../services/foodService';

const meals = [
  { key: 'breakfast', label: 'Breakfast', icon: '🍳' },
  { key: 'morningSnack', label: 'Morning Snack', icon: '🥐' },
  { key: 'lunch', label: 'Lunch', icon: '🥗' },
  { key: 'eveningSnack', label: 'Evening Snack', icon: '🍪' },
  { key: 'dinner', label: 'Dinner', icon: '🍽️' },
];

const statFields = [
  { key: 'protein', label: 'Protein', unit: 'g' },
  { key: 'carbs', label: 'Carbs', unit: 'g' },
  { key: 'fat', label: 'Fat', unit: 'g' },
  { key: 'fiber', label: 'Fiber', unit: 'g' },
  { key: 'calories', label: 'Calories', unit: 'kcal' },
];

const isoDate = (d) => new Date(d).toISOString().slice(0, 10);

const EmptyTotals = {
  calories: 0,
  protein: 0,
  carbs: 0,
  fat: 0,
  fiber: 0,
};

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
}) => (
  <form className="add-food-form" onSubmit={onSubmit}>
    <h3>Add Food</h3>

    <label className="field">
      <span className="field-label">Meal</span>

      <select
        value={meal}
        onChange={(e) => onMealChange(e.target.value)}
        disabled={aiAnalyzing || submitting}
      >
        {meals.map((m) => (
          <option key={m.key} value={m.key}>
            {m.label}
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
            placeholder="e.g. 2 eggs, 200g rice and 150g chicken"
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
            {aiAnalyzing ? 'Analyzing…' : 'Analyze Food'}
          </button>
        </div>
      </>
    ) : (
      <div className="ai-food-preview">
        <h4>AI Nutrition Estimate</h4>

        <p className="muted">
          Nutrition values are approximate estimates based on what you entered.
        </p>

        {aiPreview.items?.length > 0 ? (
          <div className="ai-food-items">
            {aiPreview.items.map((item, index) => {
              const nutrition = item.nutrition || {};

              return (
                <div
                  className="ai-food-item"
                  key={`${item.name}-${index}`}
                >
                  <div>
                    <strong>{item.name}</strong>

                    <div className="muted">
                      {item.quantity} {item.unit}
                    </div>
                  </div>

                  <div className="ai-food-nutrition">
                    <div>
                      <strong>
                        {Math.round(Number(nutrition.calories) || 0)} kcal
                      </strong>
                    </div>

                    <div className="muted">
                      Protein {Math.round(Number(nutrition.protein) || 0)}g
                      {' · '}
                      Carbs {Math.round(Number(nutrition.carbs) || 0)}g
                      {' · '}
                      Fat {Math.round(Number(nutrition.fat) || 0)}g
                      {' · '}
                      Fiber {Math.round(Number(nutrition.fiber) || 0)}g
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="muted">
            No food items were detected. Try describing what you ate with
            quantities.
          </p>
        )}

        <div className="form-actions">
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
            disabled={
              submitting ||
              !aiPreview.items?.length
            }
          >
            {submitting ? 'Adding…' : 'Confirm & Add'}
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
  const [editQty, setEditQty] = useState(1);

  useEffect(() => {
    fetchLog(selectedDate);
    setFormOpenFor(null);
    setOpenMenuItemId(null);
    setEditingItemId(null);
  }, [selectedDate]);

  const fetchLog = async (date) => {
    setLoading(true);
    setError(null);

    try {
      const res = await foodService.getFoodLogByDate(date);
      setFoodLog(res.foodLog || { meals: {} });
    } catch (e) {
      setError('Failed to load food log');
    } finally {
      setLoading(false);
    }
  };

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

        console.log('Adding AI food:', payload);

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
    } catch (e) {
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
    } catch (e) {
      setError('Failed to update entry');
    } finally {
      setEditingItemId(null);
    }
  };

  const navDay = (delta) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + delta);
    setSelectedDate(isoDate(d));
  };

  const totals = calculateFoodTotals(foodLog);

  const displayDate = new Date(selectedDate).toLocaleDateString(
    undefined,
    {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    }
  );

  const renderForm = (mealKey) => (
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
    />
  );

  return (
    <div className="page-card food-page">
      <p className="eyebrow">Nutrition</p>
      <h1>Food</h1>

      <div className="food-date">{displayDate}</div>

      <div className="date-nav">
        <button
          className="link"
          onClick={() => navDay(-1)}
        >
          ← Previous
        </button>

        <button
          className="btn"
          onClick={() => setSelectedDate(isoDate(new Date()))}
        >
          Today
        </button>

        <button
          className="link"
          onClick={() => navDay(1)}
        >
          Next →
        </button>
      </div>

      <div className="food-section">
        <h4 className="section-title">Nutrition Summary</h4>

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
        <div className="card">
          Loading food log…
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
                + Add Food
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
                      <span aria-hidden>
                        {m.icon}
                      </span>{' '}
                      {m.label}
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
                          icon={m.icon}
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