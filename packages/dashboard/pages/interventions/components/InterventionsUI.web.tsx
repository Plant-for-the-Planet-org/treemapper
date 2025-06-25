
import TreeManagement from "./web/TreeManagement";

export function InterventionUI(props:any) {
  return <TreeManagement newIntervention={props.newIntervention} bulkUpload={props.bulkUpload}/>
}

export default InterventionUI;