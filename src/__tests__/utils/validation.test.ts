import {
  validateExerciseWeight,
  validateBodyWeight,
  validateReps,
  validateSets,
  validateRPE,
  validateCalories,
  validateMacro,
  validateMacros,
  validateSteps,
  validateName,
  validateNotes,
  validateMeal,
  validateSet,
} from '../../utils/validation';

describe('validateExerciseWeight', () => {
  it('should accept valid weights', () => {
    expect(validateExerciseWeight(0).isValid).toBe(true);
    expect(validateExerciseWeight(135).isValid).toBe(true);
    expect(validateExerciseWeight(500).isValid).toBe(true);
  });

  it('should reject negative weights', () => {
    const result = validateExerciseWeight(-10);
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('negative');
  });

  it('should reject excessive weights in lbs', () => {
    const result = validateExerciseWeight(1600, 'lbs');
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('1500');
  });

  it('should reject excessive weights in kg', () => {
    const result = validateExerciseWeight(800, 'kg');
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('700');
  });
});

describe('validateBodyWeight', () => {
  it('should accept valid body weights', () => {
    expect(validateBodyWeight(150, 'lbs').isValid).toBe(true);
    expect(validateBodyWeight(70, 'kg').isValid).toBe(true);
  });

  it('should reject too low body weights', () => {
    const result = validateBodyWeight(40, 'lbs');
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('at least');
  });

  it('should reject too high body weights', () => {
    const result = validateBodyWeight(1100, 'lbs');
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('exceed');
  });
});

describe('validateReps', () => {
  it('should accept valid reps', () => {
    expect(validateReps(0).isValid).toBe(true);
    expect(validateReps(10).isValid).toBe(true);
    expect(validateReps(100).isValid).toBe(true);
  });

  it('should reject non-integer reps', () => {
    const result = validateReps(10.5);
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('whole number');
  });

  it('should reject negative reps', () => {
    const result = validateReps(-5);
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('negative');
  });

  it('should reject excessive reps', () => {
    const result = validateReps(1001);
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('1000');
  });
});

describe('validateSets', () => {
  it('should accept valid sets', () => {
    expect(validateSets(1).isValid).toBe(true);
    expect(validateSets(5).isValid).toBe(true);
    expect(validateSets(10).isValid).toBe(true);
  });

  it('should reject zero sets', () => {
    const result = validateSets(0);
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('at least 1');
  });

  it('should reject non-integer sets', () => {
    const result = validateSets(3.5);
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('whole number');
  });

  it('should reject excessive sets', () => {
    const result = validateSets(101);
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('100');
  });
});

describe('validateRPE', () => {
  it('should accept valid RPE values', () => {
    expect(validateRPE(1).isValid).toBe(true);
    expect(validateRPE(5).isValid).toBe(true);
    expect(validateRPE(10).isValid).toBe(true);
  });

  it('should reject RPE below 1', () => {
    const result = validateRPE(0);
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('between 1 and 10');
  });

  it('should reject RPE above 10', () => {
    const result = validateRPE(11);
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('between 1 and 10');
  });
});

describe('validateCalories', () => {
  it('should accept valid calorie values', () => {
    expect(validateCalories(0).isValid).toBe(true);
    expect(validateCalories(500).isValid).toBe(true);
    expect(validateCalories(2000).isValid).toBe(true);
  });

  it('should reject negative calories', () => {
    const result = validateCalories(-100);
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('negative');
  });

  it('should reject excessive calories', () => {
    const result = validateCalories(15000);
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('10000');
  });
});

describe('validateMacro', () => {
  it('should accept valid macro values', () => {
    expect(validateMacro(0, 'Protein').isValid).toBe(true);
    expect(validateMacro(50, 'Carbs').isValid).toBe(true);
    expect(validateMacro(100, 'Fats').isValid).toBe(true);
  });

  it('should reject negative macros', () => {
    const result = validateMacro(-10, 'Protein');
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('Protein');
    expect(result.error).toContain('negative');
  });

  it('should reject excessive macros', () => {
    const result = validateMacro(1500, 'Carbs');
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('1000');
  });
});

describe('validateMacros', () => {
  it('should accept valid macros', () => {
    expect(validateMacros(30, 50, 20).isValid).toBe(true);
  });

  it('should reject if any macro is invalid', () => {
    expect(validateMacros(-10, 50, 20).isValid).toBe(false);
    expect(validateMacros(30, -50, 20).isValid).toBe(false);
    expect(validateMacros(30, 50, -20).isValid).toBe(false);
  });
});

describe('validateSteps', () => {
  it('should accept valid step counts', () => {
    expect(validateSteps(0).isValid).toBe(true);
    expect(validateSteps(10000).isValid).toBe(true);
    expect(validateSteps(50000).isValid).toBe(true);
  });

  it('should reject non-integer steps', () => {
    const result = validateSteps(5000.5);
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('whole number');
  });

  it('should reject negative steps', () => {
    const result = validateSteps(-1000);
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('negative');
  });

  it('should reject excessive steps', () => {
    const result = validateSteps(150000);
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('100000');
  });
});

describe('validateName', () => {
  it('should accept valid names', () => {
    expect(validateName('Lunch').isValid).toBe(true);
    expect(validateName('Morning Workout').isValid).toBe(true);
  });

  it('should reject empty names', () => {
    const result = validateName('');
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('required');
  });

  it('should reject whitespace-only names', () => {
    const result = validateName('   ');
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('required');
  });

  it('should reject excessively long names', () => {
    const longName = 'a'.repeat(101);
    const result = validateName(longName);
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('100');
  });
});

describe('validateNotes', () => {
  it('should accept valid notes', () => {
    expect(validateNotes('').isValid).toBe(true);
    expect(validateNotes('Some notes here').isValid).toBe(true);
  });

  it('should reject excessively long notes', () => {
    const longNotes = 'a'.repeat(1001);
    const result = validateNotes(longNotes);
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('1000');
  });
});

describe('validateMeal', () => {
  it('should accept valid meals', () => {
    const result = validateMeal({
      name: 'Lunch',
      calories: 500,
      protein: 30,
      carbs: 50,
      fats: 20,
    });
    expect(result.isValid).toBe(true);
  });

  it('should reject meals with empty names', () => {
    const result = validateMeal({
      name: '',
      calories: 500,
      protein: 30,
      carbs: 50,
      fats: 20,
    });
    expect(result.isValid).toBe(false);
  });

  it('should reject meals with invalid calories', () => {
    const result = validateMeal({
      name: 'Lunch',
      calories: -100,
      protein: 30,
      carbs: 50,
      fats: 20,
    });
    expect(result.isValid).toBe(false);
  });

  it('should reject meals with invalid macros', () => {
    const result = validateMeal({
      name: 'Lunch',
      calories: 500,
      protein: -30,
      carbs: 50,
      fats: 20,
    });
    expect(result.isValid).toBe(false);
  });
});

describe('validateSet', () => {
  it('should accept valid sets', () => {
    const result = validateSet({ weight: 135, reps: 10 });
    expect(result.isValid).toBe(true);
  });

  it('should accept sets with RPE', () => {
    const result = validateSet({ weight: 135, reps: 10, rpe: 8 });
    expect(result.isValid).toBe(true);
  });

  it('should reject sets with invalid weight', () => {
    const result = validateSet({ weight: -10, reps: 10 });
    expect(result.isValid).toBe(false);
  });

  it('should reject sets with invalid reps', () => {
    const result = validateSet({ weight: 135, reps: -5 });
    expect(result.isValid).toBe(false);
  });

  it('should reject sets with invalid RPE', () => {
    const result = validateSet({ weight: 135, reps: 10, rpe: 15 });
    expect(result.isValid).toBe(false);
  });
});
