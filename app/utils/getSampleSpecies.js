export const getNotSampledSpecies = (inventory) => {
  let sampledSpecies = [];
  let plantedSpecies = [];
  let notSampledSpecies = [];
  inventory.sampleTrees.forEach((sampleTree) => {
    sampledSpecies.push(sampleTree.specieId);
  });
  inventory.species.forEach((specie) => {
    plantedSpecies.push(specie.id);
  });
  sampledSpecies = [...new Set(sampledSpecies)];
  plantedSpecies.forEach((specie) =>
    sampledSpecies.includes(specie) ? notSampledSpecies : notSampledSpecies.push(specie),
  );
  return notSampledSpecies;
};
