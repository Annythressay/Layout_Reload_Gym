export const fields = {
  height: ['Chiều cao', 130, 210, 'cm'], weight: ['Cân nặng', 35, 180, 'kg'],
  chest: ['Vòng ngực', 60, 150, 'cm'], waist: ['Vòng eo', 45, 160, 'cm'],
  hip: ['Vòng hông', 60, 170, 'cm'], inseam: ['Chiều dài chân', 50, 110, 'cm'],
  shoulder: ['Chiều rộng vai', 28, 65, 'cm'], arm: ['Bắp tay', 20, 70, 'cm'], thigh: ['Vòng đùi', 30, 100, 'cm']
};
export const defaults = Object.freeze({gender:'neutral', height:165, weight:60, chest:88, waist:72, hip:92, inseam:76, shoulder:38, arm:28, thigh:52});
export function validateMeasurement(key, raw) {
  const field = fields[key];
  const value = Number(raw);
  return field && String(raw).trim() && Number.isFinite(value) && value >= field[1] && value <= field[2] ? Math.round(value * 10) / 10 : null;
}
export function calculateBMI(heightCm, weightKg) {
  return Number.isFinite(heightCm) && Number.isFinite(weightKg) && heightCm > 0 && weightKg > 0 ? (weightKg / (heightCm / 100) ** 2).toFixed(1) : null;
}
export function createState() { return {currentBody:{...defaults}, goalBody:null, mode:'current', step:0, selectedGoal:null}; }
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
// Illustration, not anthropometric reconstruction. Independent of Three.js.
// Circumferences approximate elliptical sections; guard proportions at extreme inputs.
export function calculateBodyMorph(m) {
  const height = m.height / 100;
  const thickness = clamp(1 + (m.weight - 60) / 600, .95, 1.2);
  const radius = cm => cm / 100 / 5.5 * thickness;
  return {
    height, leg:clamp(m.inseam / 100, height * .36, height * .55),
    chest:radius(m.chest), waist:radius(m.waist), hip:radius(m.hip),
    shoulder:clamp(m.shoulder / 200, .14, .325),
    arm:clamp(m.arm / 100 / (Math.PI * 2) * thickness, .032, .112),
    thigh:clamp(m.thigh / 100 / (Math.PI * 2) * thickness, .048, .16),
    depth:m.gender === 'female' ? .76 : m.gender === 'male' ? .66 : .71
  };
}
