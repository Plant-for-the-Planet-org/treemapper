import CountryData from './countryData.json';

const handleFilter = (input) => {
  const filteredData = CountryData.filter(el => el.countryCode.toLowerCase().includes(input.toLowerCase()));
  return filteredData;
};

export {handleFilter};