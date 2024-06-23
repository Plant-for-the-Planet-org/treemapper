import useManageScientificSpecies from "./realm/useManageScientificSpecies"




const useInitalSetup = () => {
  const { addUndefinedSpecies} = useManageScientificSpecies()

  const setupApp = async () => {
    const result = await addUndefinedSpecies()
    return result
  }


  return { setupApp }
}

export default useInitalSetup
