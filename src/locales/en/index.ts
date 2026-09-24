import { common } from "./common"
import { nav, search, footer, meta } from "./nav"
import { home } from "./home"
import { validation } from "./validation"
import { catalog, product } from "./catalog"
import { cart, checkout, cities, errors } from "./checkout"
import { order } from "./order"
import { auth } from "./auth"
import { account } from "./account"
import { admin } from "./admin"
import { info } from "./info"

// The English dictionary is the source of truth: its shape defines the
// `Dictionary` type, and ../am must provide every key (a missing translation
// is a compile error, not a runtime hole).
export const en = {
  common,
  nav,
  search,
  footer,
  meta,
  home,
  validation,
  catalog,
  product,
  cart,
  checkout,
  cities,
  errors,
  order,
  auth,
  account,
  admin,
  info,
}

export type Dictionary = typeof en
