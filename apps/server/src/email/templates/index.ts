import { migrationRequest } from "./migrationRequest";
import { inviteTemplate } from './inviteTemplate'
import { contactSupportTemplate } from './contactSupport'

export const selectedTempalte=(name)=>{
  if(name==='migrationRequest'){
    return migrationRequest
  }else if(name==='contactSupport'){
    return contactSupportTemplate
  }else{
    return inviteTemplate
  }
}