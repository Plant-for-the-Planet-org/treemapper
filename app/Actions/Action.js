class LocalInventoryActions {
    static SET_INVENTORY_ID = 'SET_INVENTORY_ID';
    static setInventory = (payload) => ({
        type: LocalInventoryActions.SET_INVENTORY_ID,
        payload: payload
    })

}