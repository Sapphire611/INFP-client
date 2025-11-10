import { makeAutoObservable } from "mobx";
import { GlobalService } from "@shared/server/Global";
import { AuthStore } from "../AuthStore";

class _GlobalStore {
  customerId = "";
  customerName = "Roc";

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true });
  }

  // 从 AuthStore 获取 token
  get token() {
    return AuthStore.token;
  }

  setCustomerName(val: string) {
    this.customerName = val;
  }

  async getData() {
    await GlobalService.getList();
  }
}
export const GlobalStore = new _GlobalStore();
