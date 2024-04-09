export enum SPECIES_SYNC_STATE {
  INITIAL = 'INITIAL',
  DOWNLOADING = 'DOWNLOADING',
  DOWNLOAD_FAILED = 'DOWNLOAD_FAILED',
  UNZIPPING_FILE = 'UNZIPPING_FILE',
  UNZIPPING_FAILED = 'UNZIPPING_FAILED',
  READING_FILE = 'READING_FILE',
  READING_FAILED = 'READING_FAILED',
  SAVING_LOCALLY = 'SAVING_LOCALLY',
  SAVING_FAILED = 'SAVING_FAILED',
  ERROR_OCCURED = 'ERROR_OCCURED'
}