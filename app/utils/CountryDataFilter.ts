import CountryData from './countryData.json';

const handleFilter = (input: string) => {
  const filteredData = CountryData.filter((el) =>
    el.countryCode.toLowerCase().includes(input.toLowerCase()),
  );
  return filteredData;
};

export { handleFilter };
