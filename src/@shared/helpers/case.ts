export function convertToOtherCase(o: any, convertTo: "camel" | "snake") {
  let newO: any;
  let origKey;
  let newKey;
  let value;

  if (typeof o === "string") {
    return convertTo === "camel" ? toCamelCase(o) : toSnakeCase(o);
  } else if (o instanceof Array) {
    return o.map((value) => {
      if (typeof value === "object") {
        value = convertToOtherCase(value, convertTo);
      }
      return value;
    });
  } else {
    newO = {};
    for (origKey in o) {
      if (Object.hasOwnProperty.call(o, origKey)) {
        newKey =
          convertTo === "camel" ? toCamelCase(origKey) : toSnakeCase(origKey);

        value = o[origKey];

        if (
          value &&
          (value instanceof Array ||
            (value !== null && value.constructor === Object))
        ) {
          value = convertToOtherCase(value, convertTo);
        }
        newO[newKey] = value;
      }
    }
  }

  return newO;
}

const toCamelCase = (s: string) => {
  return s
    .toLowerCase()
    .replace(/[-_][a-z0-9]/g, (group) => group.slice(-1).toUpperCase());
};

const toSnakeCase = (s: string) => {
  return s.replace(/[A-Z0-9]/g, (letter) => `_${letter.toLowerCase()}`);
};
