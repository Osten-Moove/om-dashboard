export function transformObject(input: any) {
  const result = input.reduce((acc: any, item: any) => {
    acc[item.searchId] = { value: item.value, type: item.type };
    return acc;
  }, {});

  return result;
}
