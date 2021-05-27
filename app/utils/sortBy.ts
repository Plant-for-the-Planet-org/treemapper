export const sortByField = (fieldName: string, arrayData: any) => {
  return arrayData.sort((a: any, b: any) => {
    return a[`${fieldName}`] - b[`${fieldName}`];
  });
};
export const filterFormByTreeAndRegistrationType = (
  formData: any,
  treeType: string,
  registrationType: string,
) => {
  console.log('\n\n\n\n\n\n');
  console.log('treeType', treeType);
  console.log('registrationType', registrationType);
  if (treeType && treeType.toLowerCase() !== 'all') {
    for (let i in formData) {
      let elements: any = formData[i].elements;
      console.log('elements=>>>>>>>>>', elements);
      elements = elements.filter((element: any) => element.treeType.includes(treeType));
      console.log('elements=>>>>>>>>>222222222222222', elements);
      formData[i].elements = elements;
    }
  }
  if (registrationType && registrationType.toLowerCase() !== 'all') {
    for (let i in formData) {
      let elements: any = formData[i].elements;
      elements = elements.filter((element: any) =>
        element.registrationType.includes(registrationType),
      );
      formData[i].elements = elements;
    }
  }
  return formData;
};
