export const API_ROUTE = 'http://localhost:8088'

// groups & documents main path
const API_ROUTE_GROUPS = `groups`
const API_ROUTE_DOCUMENTS = `documents`
// groups & documents sub paths
export const AR_GROUPS_GET_PAGE = `${API_ROUTE}/${API_ROUTE_GROUPS}`
export const AR_DOCUMENTS_GET_DOCUMENTS = `${API_ROUTE}/${API_ROUTE_DOCUMENTS}`
export const AR_DOCUMENTS_GET_DOCUMENTS_DISPLAY = `${API_ROUTE}/${API_ROUTE_DOCUMENTS}/display`

// users main path
const API_ROUTE_USERS = `users`
// users sub paths
export const AR_USERS_GET_USER = `${API_ROUTE}/${API_ROUTE_USERS}/me`
export const AR_USERS_SIGNUP = `${API_ROUTE}/${API_ROUTE_USERS}/signup`
export const AR_USERS_ACTIVATE_USER = `${API_ROUTE}/${API_ROUTE_USERS}/activate`
export const AR_USERS_DELETE_USER = `${API_ROUTE}/${API_ROUTE_USERS}`

// auth main path
const API_ROUTE_AUTH = `auth`
// auth sub paths
export const AR_AUTH_GET_TOKEN = `${API_ROUTE}/${API_ROUTE_AUTH}/token`
export const AR_AUTH_SEND_VALIDATION_CODE = `${API_ROUTE}/${API_ROUTE_AUTH}/send-one-time-password`

// upload main path
const API_ROUTE_UPLOAD = `upload`
// auth sub paths
export const AR_UPLOAD_FILE_ = `${API_ROUTE}/${API_ROUTE_UPLOAD}/`
export const AR_UPLOAD_HISTORY = `${API_ROUTE}/${API_ROUTE_UPLOAD}/history`
export const AR_UPLOAD_STATUS = `${API_ROUTE}/${API_ROUTE_UPLOAD}`

