/**
 * 数组分块
 */
export const chunkArray = (arr: any[], size: number) => {
  const objArr = [];
  let index = 0;
  const objArrLen = arr.length / size;
  for (let i = 0; i < objArrLen; i++) {
    const arrTemp = [];
    for (let j = 0; j < size; j++) {
      arrTemp[j] = arr[index++];
      if (index === arr.length) {
        break;
      }
    }
    objArr[i] = arrTemp;
  }
  return objArr;
};
/**
 * 数组去重
 */
export const uniq = (array: any[]) => {
  const temp = [];
  const index = [];
  const l = array.length;
  for (let i = 0; i < l; i++) {
    for (let j = i + 1; j < l; j++) {
      if (array[i] === array[j]) {
        i++;
        j = i;
      }
    }
    temp.push(array[i]);
    index.push(i);
  }
  return temp;
};
