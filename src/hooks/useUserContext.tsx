import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";


export const UseUserContextHook = ()=>{
    const context = useContext(AuthContext)
    if(!context){
        return console.log("the user data should be provided in user context")
    }
    return context
}   