import { migrationRequest } from "./migrationRequest";
import { inviteTemplate } from './inviteTemplate'

export const selectedTempalte=(name)=>{
  if(name==='migrationRequest'){
    return migrationRequest
  }else{
    return inviteTemplate
  }
}