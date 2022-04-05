export interface IAddPlantLocationEventData {
  type: 'measurement' | 'status';
  eventDate: string;
  measurements?: {
    height: number;
    width: number;
  };
  imageFile?: string;
  status?: 'dead';
  statusReason?: 'flood|fire|drought|other';
  metadata?: {
    public?: any;
    private?: any;
    app?: any;
  };
}
