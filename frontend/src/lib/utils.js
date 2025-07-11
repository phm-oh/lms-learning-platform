// frontend/src/lib/utils.js

/**
 * cn = ClassNames helper
 * รวม class หลายๆอันเป็น string เดียว
 * กรองพวก falsy values (undefined, null, false, '') ทิ้ง
 */
export function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}
