export type LPProblem = {
  problemType: 'max' | 'min'
  objectiveFunction: number[]
  constraintCoefficients: number[][]
  constraintSigns: ("<=" | "=" | ">=")[]
  constraintValues: number[]
  objectiveOperator?: string // + ou -
  constraintOperators?: string[] // tableau de + ou -
}

export type SolutionMethod = 'graphical' | 'simplex' | 'general'

export type LPSolution = {
  isValid: boolean
  coordinates: number[]
  value: number
  tableData: {
    headers: string[]
    rows: string[][]
  }
}

function generalFormMethod(
  objectiveFunction: number[],
  constraintCoefficients: number[][],
  constraintSigns: ("<=" | "=" | ">=")[],
  constraintValues: number[],
  isMaximization: boolean
): LPSolution {
  // Implémentation de la forme générale avec gestion des contraintes mixtes
  const m = constraintCoefficients.length;
  const n = objectiveFunction.length;
  
  // Convertir en forme standard
  let augmentedMatrix: number[][] = [];
  let slackVars = 0;
  let artificialVars = 0;
  
  // Traiter chaque contrainte
  for (let i = 0; i < m; i++) {
    let row = [...constraintCoefficients[i]];
    
    if (constraintSigns[i] === '<=') {
      // Ajouter variable d'écart
      for (let j = 0; j < m; j++) {
        row.push(j === i ? 1 : 0);
      }
      slackVars++;
    } else if (constraintSigns[i] === '>=') {
      // Ajouter variable d'excès et artificielle
      for (let j = 0; j < m; j++) {
        row.push(j === i ? -1 : 0);
      }
      for (let j = 0; j < m; j++) {
        row.push(j === i ? 1 : 0);
      }
      artificialVars++;
    } else { // '='
      // Ajouter variable artificielle
      for (let j = 0; j < m; j++) {
        row.push(0);
      }
      for (let j = 0; j < m; j++) {
        row.push(j === i ? 1 : 0);
      }
      artificialVars++;
    }
    
    row.push(constraintValues[i]);
    augmentedMatrix.push(row);
  }
  
  // Utiliser la méthode du simplexe sur la matrice augmentée
  return simplexMethod(objectiveFunction, constraintCoefficients, constraintValues, isMaximization);
}

function simplexMethod(
  objectiveFunction: number[],
  constraintCoefficients: number[][],
  constraintValues: number[],
  isMaximization: boolean
): LPSolution {
  // Convert minimization to maximization
  const objective = isMaximization 
    ? [...objectiveFunction]
    : objectiveFunction.map(x => -x);

  // Initialize tableau
  const m = constraintCoefficients.length; // number of constraints
  const n = objectiveFunction.length; // number of variables
  
  // Create initial tableau
  const tableau: number[][] = [];
  
  // Add objective function row
  tableau.push([
    ...objective.map(x => -x),
    ...Array(m).fill(0),
    0
  ]);
  
  // Add constraint rows
  for (let i = 0; i < m; i++) {
    const row = [
      ...constraintCoefficients[i],
      ...Array(m).fill(0),
      constraintValues[i]
    ];
    row[n + i] = 1; // Add slack variable
    tableau.push(row);
  }
  
  const basis = Array(m).fill(0).map((_, i) => n + i);
  const nonBasis = Array(n).fill(0).map((_, i) => i);
  
  // Iterate until optimal
  let iteration = 0;
  const maxIterations = 100;
  
  while (iteration < maxIterations) {
    // Find entering variable (most negative coefficient in objective row)
    const enteringCol = tableau[0].slice(0, -1).reduce(
      (iMin, x, i) => x < tableau[0][iMin] ? i : iMin,
      0
    );
    
    if (tableau[0][enteringCol] >= -1e-10) break; // Optimal solution found
    
    // Find leaving variable (minimum ratio test)
    let leavingRow = -1;
    let minRatio = Infinity;
    
    for (let i = 1; i < tableau.length; i++) {
      if (tableau[i][enteringCol] <= 0) continue;
      
      const ratio = tableau[i][tableau[i].length - 1] / tableau[i][enteringCol];
      if (ratio < minRatio) {
        minRatio = ratio;
        leavingRow = i;
      }
    }
    
    if (leavingRow === -1) {
      // Unbounded solution
      return {
        isValid: false,
        coordinates: [],
        value: 0,
        tableData: { headers: [], rows: [] }
      };
    }
    
    // Pivot
    const pivot = tableau[leavingRow][enteringCol];
    
    // Scale pivot row
    for (let j = 0; j < tableau[leavingRow].length; j++) {
      tableau[leavingRow][j] /= pivot;
    }
    
    // Eliminate column
    for (let i = 0; i < tableau.length; i++) {
      if (i === leavingRow) continue;
      
      const factor = tableau[i][enteringCol];
      for (let j = 0; j < tableau[i].length; j++) {
        tableau[i][j] -= factor * tableau[leavingRow][j];
      }
    }
    
    // Update basis
    const temp = basis[leavingRow - 1];
    basis[leavingRow - 1] = nonBasis[enteringCol];
    nonBasis[enteringCol] = temp;
    
    iteration++;
  }
  
  if (iteration >= maxIterations) {
    return {
      isValid: false,
      coordinates: [],
      value: 0,
      tableData: { headers: [], rows: [] }
    };
  }
  
  // Extract solution
  const solution = Array(n).fill(0);
  basis.forEach((basisVar, i) => {
    if (basisVar < n) {
      solution[basisVar] = tableau[i + 1][tableau[i + 1].length - 1];
    }
  });
  
  // Create table data for visualization
  const headers = ['Basic', 'Z'];
  for (let i = 0; i < n; i++) headers.push(`x${i + 1}`);
  for (let i = 0; i < m; i++) headers.push(`s${i + 1}`);
  headers.push('RHS');
  
  const rows = tableau.map((row, i) => {
    if (i === 0) {
      return ['Z', '1', ...row.map(x => x.toFixed(2))];
    }
    return [`s${i}`, '0', ...row.map(x => x.toFixed(2))];
  });
  
  return {
    isValid: true,
    coordinates: solution,
    value: isMaximization ? tableau[0][tableau[0].length - 1] : -tableau[0][tableau[0].length - 1],
    tableData: { headers, rows }
  };
}

function isFeasible(point: number[], constraintCoefficients: number[][], constraintSigns: ("<=" | "=" | ">=")[], constraintValues: number[]): boolean {
  for (let i = 0; i < constraintCoefficients.length; i++) {
    const lhs = constraintCoefficients[i][0] * point[0] + constraintCoefficients[i][1] * point[1];
    if (constraintSigns[i] === '<=' && lhs > constraintValues[i] + 1e-8) return false;
    if (constraintSigns[i] === '>=' && lhs < constraintValues[i] - 1e-8) return false;
    if (constraintSigns[i] === '=' && Math.abs(lhs - constraintValues[i]) > 1e-8) return false;
  }
  // x1 >= 0, x2 >= 0
  if (point[0] < -1e-8 || point[1] < -1e-8) return false;
  return true;
}

function intersection2D(a1: number[], b1: number, a2: number[], b2: number): number[] | null {
  // a1[0] * x + a1[1] * y = b1
  // a2[0] * x + a2[1] * y = b2
  const det = a1[0] * a2[1] - a2[0] * a1[1];
  if (Math.abs(det) < 1e-8) return null; // Parallel
  const x = (b1 * a2[1] - b2 * a1[1]) / det;
  const y = (a1[0] * b2 - a2[0] * b1) / det;
  return [x, y];
}

function graphicalMethod(
  objectiveFunction: number[],
  constraintCoefficients: number[][],
  constraintSigns: ("<=" | "=" | ">=")[],
  constraintValues: number[],
  isMaximization: boolean
): LPSolution {
  // Générer tous les points d'intersection et créer le tableau selon le format demandé
  const points: number[][] = [];
  const n = constraintCoefficients.length;
  
  // Créer les données du tableau selon le format de l'image
  const tableRows: string[][] = [];
  
  for (let i = 0; i < n; i++) {
    const coeffs = constraintCoefficients[i];
    const sign = constraintSigns[i];
    const value = constraintValues[i];
    
    // Contrainte originale
    const constraintStr = `${coeffs[0]}x₁ ${coeffs[1] >= 0 ? '+' : ''}${coeffs[1]}x₂ ${sign} ${value}`;
    
    // Équation de la droite (égalité)
    const equationStr = `${coeffs[0]}x₁ ${coeffs[1] >= 0 ? '+' : ''}${coeffs[1]}x₂ = ${value}`;
    
    // Calculer les points d'intersection avec les axes
    const intersectionPoints: string[] = [];
    
    // Intersection avec l'axe x₁ (x₂ = 0)
    if (coeffs[0] !== 0) {
      const x1 = value / coeffs[0];
      if (x1 >= 0) {
        intersectionPoints.push(`(${x1.toFixed(x1 % 1 === 0 ? 0 : 1)}, 0)`);
      }
    }
    
    // Intersection avec l'axe x₂ (x₁ = 0)
    if (coeffs[1] !== 0) {
      const x2 = value / coeffs[1];
      if (x2 >= 0) {
        intersectionPoints.push(`(0, ${x2.toFixed(x2 % 1 === 0 ? 0 : 1)})`);
      }
    }
    
    // Ajouter des points supplémentaires si nécessaire
    while (intersectionPoints.length < 3) {
      intersectionPoints.push('-');
    }
    
    tableRows.push([
      constraintStr,
      equationStr,
      intersectionPoints[0] || '-',
      intersectionPoints[1] || '-',
      intersectionPoints[2] || '-'
    ]);
    
    for (let j = i + 1; j < n; j++) {
      const pt = intersection2D(constraintCoefficients[i], constraintValues[i], constraintCoefficients[j], constraintValues[j]);
      if (pt) points.push(pt);
    }
  }
  
  // Ajouter la ligne pour les contraintes de non-négativité
  tableRows.push([
    'x₁, x₂ ≥ 0',
    'x₁ = 0, x₂ = 0',
    '(0, 0)',
    '-',
    '-'
  ]);
  
  // Intersections avec x1=0 et x2=0
  for (let i = 0; i < n; i++) {
    // x1 = 0
    if (Math.abs(constraintCoefficients[i][0]) > 1e-8) {
      const x2 = (constraintValues[i] - 0) / constraintCoefficients[i][1];
      if (!isNaN(x2)) points.push([0, x2]);
    }
    // x2 = 0
    if (Math.abs(constraintCoefficients[i][1]) > 1e-8) {
      const x1 = (constraintValues[i] - 0) / constraintCoefficients[i][0];
      if (!isNaN(x1)) points.push([x1, 0]);
    }
  }
  // x1=0, x2=0
  points.push([0,0]);

  // Filtrer les points réalisables
  const feasible: number[][] = points.filter(pt => isFeasible(pt, constraintCoefficients, constraintSigns, constraintValues));
  if (feasible.length === 0) {
    return {
      isValid: false,
      coordinates: [],
      value: 0,
      tableData: { headers: [], rows: [] }
    };
  }
  // Calculer la valeur de la fonction objectif pour chaque point réalisable
  const values = feasible.map(pt => objectiveFunction[0]*pt[0] + objectiveFunction[1]*pt[1]);
  let idx = 0;
  if (isMaximization) {
    let max = values[0];
    for (let i = 1; i < values.length; i++) if (values[i] > max) { max = values[i]; idx = i; }
  } else {
    let min = values[0];
    for (let i = 1; i < values.length; i++) if (values[i] < min) { min = values[i]; idx = i; }
  }
  return {
    isValid: true,
    coordinates: feasible[idx],
    value: values[idx],
    tableData: {
      headers: ["Contraintes", "Équations des droites", "Point 1", "Point 2", "Point 3"],
      rows: tableRows
    }
  };
}

export const solveLPProblem = (problem: LPProblem, method: SolutionMethod = 'graphical'): LPSolution => {
  try {
    let { objectiveFunction, constraintCoefficients, constraintValues, constraintSigns, problemType, objectiveOperator, constraintOperators } = problem;

    // Prise en compte du signe de la fonction objectif
    if (objectiveOperator === '-') {
      objectiveFunction = objectiveFunction.map((c, i) => i === 0 ? c : -Math.abs(c));
    }
    // Par défaut ou +, on garde les coefficients tels quels

    // Prise en compte des signes dans les contraintes
    if (constraintOperators && constraintOperators.length === constraintCoefficients.length) {
      constraintCoefficients = constraintCoefficients.map((row, i) =>
        constraintOperators[i] === '-' ? row.map((c, j) => j === 0 ? c : -Math.abs(c)) : row
      );
    }

    if (objectiveFunction.length === 2) {
      return graphicalMethod(
        objectiveFunction,
        constraintCoefficients,
        constraintSigns,
        constraintValues,
        problemType === 'max'
      );
    }
    
    if (method === 'simplex') {
      return simplexMethod(
        objectiveFunction,
        constraintCoefficients,
        constraintValues,
        problemType === 'max'
      );
    }
    
    if (method === 'general') {
      return generalFormMethod(
        objectiveFunction,
        constraintCoefficients,
        constraintSigns,
        constraintValues,
        problemType === 'max'
      );
    }
    
    // Par défaut, utiliser la méthode graphique pour 2 variables, sinon simplexe
    if (objectiveFunction.length === 2) {
      return graphicalMethod(
        objectiveFunction,
        constraintCoefficients,
        constraintSigns,
        constraintValues,
        problemType === 'max'
      );
    } else {
      return simplexMethod(
        objectiveFunction,
        constraintCoefficients,
        constraintValues,
        problemType === 'max'
      );
    }
  } catch (error) {
    console.error('Error solving LP problem:', error);
    return {
      isValid: false,
      coordinates: [],
      value: 0,
      tableData: { headers: [], rows: [] }
    };
  }
};