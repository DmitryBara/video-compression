export const isSubarray = (parentArray: string[], childArray: string[]) =>
  childArray.every((val) => parentArray.includes(val));
