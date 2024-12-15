// Convert inches to meters
const inchesToMeters = (inches: number) => inches * 0.0254;

// Calculate CBM (Cubic Meters) for a single unit
export const calculateUnitCBM = (length: number, width: number, height: number) => {
  if (!length || !width || !height) return 0;
  const lengthM = inchesToMeters(length);
  const widthM = inchesToMeters(width);
  const heightM = inchesToMeters(height);
  
  return Number((lengthM * widthM * heightM).toFixed(3));
};

// Calculate total CBM based on quantity
export const calculateTotalCBM = (length: number, width: number, height: number, quantity: number) => {
  if (!quantity) return 0;
  const unitCBM = calculateUnitCBM(length, width, height);
  return Number((unitCBM * quantity).toFixed(3));
};