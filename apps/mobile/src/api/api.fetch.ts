import { getUrlApi, postUrlApi, getUrlMobileApi, postUrlNewApi } from './api.url';
import { fetchDeleteCall, fetchGetCall, fetchPostCall, fetchPutCall, fetchPatchCall } from './customFetch';
import { DeviceRegistrationParams } from '../types/type/device.type';

import * as FileSystem from 'expo-file-system';
import { updateFilePath } from '../utils/helpers/fileSystemHelper'
import sampleTreeBase64 from '../../assets/images/base64/sampleTree';
import { generateUid } from 'src/utils/helpers/uidGenerator';

export const getMobileHealth = async () => {
  const uri = `${getUrlMobileApi.getMobileHealth}`;
  const result = await fetchGetCall(uri, false);
  return result;
};

export const getMobileUserDetails = async () => {
  const uri = `${getUrlMobileApi.getUserDetails}`;
  const result = await fetchGetCall(uri, true);
  return result;
};

export const getMobileInviteStatus = async (id: string) => {
  const uri = `${getUrlMobileApi.getMobileEmailInviteStatus}/${id}/status/link`;
  const result = await fetchGetCall(uri, true);
  return result;
};

export const getMobileInviteStatusEmail = async (id: string) => {
  const uri = `${getUrlMobileApi.getMobileEmailInviteStatus}/${id}/status`;
  const result = await fetchGetCall(uri, true);
  return result;
};


export const createMobileProject = async (params: any) => {
  const uri = `${postUrlNewApi.createNewProject}`;
  const result = await fetchPostCall(uri, params);
  return result;
};

export const deleteMobileIntervention = async (id: any) => {
  const uri = `${postUrlNewApi.deleteIntervention}/${id}`;
  const result = await fetchPostCall(uri, {});
  return result;
};


// export const getMobileUserSpecies = async () => {
//   const uri = `${getUrlMobileApi.userSpecies}`;
//   const result = await fetchGetCall(uri, true);
//   return result;
// };








export const uploadMobileInterventionImage = async (params) => {
  const uri = `${postUrlNewApi.uploadImageData}`
  const result = await fetchPutCall(uri, params);
  return result;
};
export const presingedUrl = async (params) => {
  const uri = `${postUrlNewApi.awsSignedUrl}`
  const result = await fetchPostCall(uri, params);
  return result;
};

export const mobileInterventionImageUplaod = async (params) => {
  const uri = `${postUrlNewApi.interventionImage}`
  const result = await fetchPostCall(uri, params);
  return result;
};

export const remeasuremenMobile = async (tree_id: string, params: any) => {
  const uri = `${postUrlNewApi.remeasurement}/${tree_id}/remeasure`
  const result = await fetchPutCall(uri, params);
  return result;
};

export const deleteAccount = async () => {
  const uri = `${postUrlApi.deleteAccount}`
  const result = await fetchDeleteCall(uri);
  return result;
};


export const getAreaName = async (coords: number[],) => {
  const uri = `${getUrlApi.getAreaName}/${coords[0]},${coords[1]}.json?types=place&access_token=${process.env.EXPO_PUBLIC_MAP_BOX_TOKEN}`
  const result = await fetchGetCall(uri, false);
  return result;
}

export const getAllSpeciesAchieve = async () => {
  const uri = `${getUrlApi.getAllSpeciesAchieve}`;
  const result = await fetchGetCall(uri, false);
  return result;
};


export const addUserSpeciesToServer = async (params: any) => {
  const uri = `${postUrlApi.addUserSpecies}`;
  const result = await fetchPostCall(uri, params);
  return result;
};


export const removeUserSpeciesToServer = async (id: any) => {
  const uri = `${postUrlApi.addUserSpecies}/${id}`;
  const result = await fetchDeleteCall(uri);
  return result;
};



export const updateServerSpeciesDetail = async (params: any, id: string) => {
  const uri = `${postUrlApi.addUserSpecies}/${id}`;
  const result = await fetchPutCall(uri, params);
  return result;
};


export const createNewSite = async (projectId: string, params: any) => {
  const uri = `${postUrlNewApi.createSite}/${projectId}/sites`
  const result = await fetchPostCall(uri, params);
  return result;
};


export const getMobileInterventions = async (page: string) => {
  const uri = `${getUrlMobileApi.getMobileInterventions}?limit=6&page=${page}`;
  const result = await fetchGetCall(uri, true);
  return result;
};

export const getSingleIntervention = async (interventionId: string) => {
  const uri = `${getUrlMobileApi.getSingleIntervention}/${interventionId}`;
  const result = await fetchGetCall(uri, true);
  return result;
};

// Published forms for a project (built on the web app). Cached in Realm for
// offline use.
export const getProjectForms = async (projectUid: string) => {
  const uri = `${getUrlMobileApi.getProjectForms}/${projectUid}/forms?status=published`;
  const result = await fetchGetCall(uri, true);
  return result;
};


// Main function to get image as base64 (from your code)
const getImageAsBase64 = async (fileUri: string): Promise<string> => {
  try {
    const base64 = await FileSystem.readAsStringAsync(fileUri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    return base64;
  } catch (error) {
    return sampleTreeBase64; // Fallback to default base64 image
  }
};

// Enhanced version with better error handling and file validation
const getImageAsBase64Enhanced = async (fileUri: string): Promise<{ success: boolean, data: string, error?: string }> => {
  try {
    // Check if file exists first
    const fileInfo = await FileSystem.getInfoAsync(fileUri);

    if (!fileInfo.exists) {
      return {
        success: false,
        data: sampleTreeBase64,
        error: 'File does not exist'
      };
    }

    const base64 = await FileSystem.readAsStringAsync(fileUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    return {
      success: true,
      data: base64
    };
  } catch (error) {
    return {
      success: false,
      data: sampleTreeBase64,
      error: error.message || 'Unknown error reading file'
    };
  }
};

// Function to get file info (size, exists, etc.)
const getFileInfo = async (fileUri: string) => {
  try {
    const fileInfo = await FileSystem.getInfoAsync(fileUri);
    return {
      exists: fileInfo.exists,
      size: fileInfo.size || 0,
      isDirectory: fileInfo.isDirectory || false,
      modificationTime: fileInfo.modificationTime || 0,
      uri: fileInfo.uri
    };
  } catch (error) {
    return {
      exists: false,
      size: 0,
      isDirectory: false,
      modificationTime: 0,
      uri: fileUri
    };
  }
};

// Function to validate image file
const validateImageFile = async (fileUri: string): Promise<{ isValid: boolean, error?: string }> => {
  try {
    const fileInfo = await FileSystem.getInfoAsync(fileUri);

    if (!fileInfo.exists) {
      return { isValid: false, error: 'File does not exist' };
    }

    // Check file size (optional - adjust limit as needed)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (fileInfo.size && fileInfo.size > maxSize) {
      return { isValid: false, error: 'File size too large' };
    }

    // Check file extension
    const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    const fileExtension = fileUri.toLowerCase().split('.').pop();
    if (!validExtensions.includes(`.${fileExtension}`)) {
      return { isValid: false, error: 'Invalid file type' };
    }

    return { isValid: true };
  } catch (error) {
    return { isValid: false, error: error.message || 'Validation failed' };
  }
};

// Updated upload function using your file system logic
export const uploadViaAPIWithFileSystem = async (selectedImage: string, uploadUrl: string) => {
  try {
    if (!uploadUrl) {
      throw new Error('Upload URL is required');
    }

    if (!selectedImage) {
      throw new Error('Selected image is required');
    }

    // Validate the image file first
    const validation = await validateImageFile(selectedImage);
    if (!validation.isValid) {
      throw new Error(`Invalid image file: ${validation.error}`);
    }

    // Use your existing file path helper if needed
    const processedPath = updateFilePath ? updateFilePath(selectedImage) : selectedImage;

    // Get image as base64 using your existing logic
    const base64Result = await getImageAsBase64Enhanced(processedPath);

    if (!base64Result.success) {
      throw new Error(`Failed to read image: ${base64Result.error}`);
    }

    // Convert base64 to binary for upload
    const binaryData = atob(base64Result.data);
    const bytes = new Uint8Array(binaryData.length);
    for (let i = 0; i < binaryData.length; i++) {
      bytes[i] = binaryData.charCodeAt(i);
    }

    // Determine content type
    const getContentType = (filePath: string) => {
      const extension = filePath.toLowerCase().split('.').pop();
      switch (extension) {
        case 'jpg':
        case 'jpeg':
          return 'image/jpeg';
        case 'png':
          return 'image/png';
        case 'gif':
          return 'image/gif';
        case 'webp':
          return 'image/webp';
        default:
          return 'image/jpeg';
      }
    };

    // Get file info for headers
    const fileInfo = await getFileInfo(processedPath);

    // Make the upload request
    const uploadResponse = await fetch(uploadUrl, {
      method: 'PUT',
      body: bytes,
      headers: {
        'Content-Type': getContentType(selectedImage),
        'Content-Length': fileInfo.size.toString(),
      }
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      throw new Error(`Upload failed with status: ${uploadResponse.status}, ${errorText}`);
    }

    return {
      success: true,
      message: 'Upload completed successfully',
      fileSize: fileInfo.size,
      fileName: selectedImage.split('/').pop()
    };

  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Upload failed',
      details: error
    };
  }
};

//GET PROJECT

export const getUserProjects = async () => {
  let result: { responseData: any, responseError: boolean }
  let { response, success } = await getAllMobileProjects()
  if (success) {
    result = { responseData: response.data, responseError: false }
  } else {
    // Failed/offline fetch. Signal an error so callers do not mistake this for
    // an empty (zero-project) account and wipe local data during sync.
    result = { responseData: null, responseError: true }
  }
  return result
}


export const getAllMobileProjects = async () => {
  const uri = `${getUrlMobileApi.getAllMobileProjects}`;
  const result = await fetchGetCall(uri, true);
  return result;
};

export const getPersonalProject = async () => {
  const uri = `${getUrlMobileApi.getPersonalProject}`;
  const result = await fetchGetCall(uri, true);
  return result;
};

// Species

export const getUserAllSpeceis = async (id?: string) => {
  let result: { responseData: any, responseError: boolean }
  if (id) {
    let { response, success } = await getUserProjectSpecies(id)
    if (success) {
      result = { responseData: response.data, responseError: false }
    } else {
      result = { responseData: null, responseError: false }
    }
    return result
  } else {
    return { responseData: null, responseError: false }
  }
}



export const getUserSpecies = async () => {
  const uri = `${getUrlApi.userSpecies}`;
  const result = await fetchGetCall(uri, true);
  return result;
};

export const getUserProjectSpecies = async (id: string) => {
  const uri = `${getUrlMobileApi.getProjectSpecies}/${id}`;
  const result = await fetchGetCall(uri, true);
  return result;
};



//Post intervention
export const uploadAllIntervention = async (params: any) => {
  const { response, success, status } = await uploadMobileIntervention(params)
  if (success && response.data && response.data.id) {
    return {
      responseData: {
        parentHid: response.data.hid,
        parentId: response.data.id,
        treeHid: response.data.singleTreeResult ? response.data.singleTreeResult.hid : '',
        treeId: response.data.singleTreeResult ? response.data.singleTreeResult.id : "",
        coordinates: [{
          "image": "",
          "created": new Date(),
          "coordinateIndex": 0,
          "id": generateUid('img'),
          "updated": new Date(),
          "status": "pending"
        }]
      }, responseError: false, status
    }
  } else {
    // Surface the HTTP status so the sync loop can tell a payload the server
    // rejected (4xx, never retryable) from a transient failure (5xx/network).
    return { responseData: null, responseError: true, status }
  }
}

export const uploadMobileIntervention = async (params: any) => {
  const uri = `${postUrlNewApi.uploadMobileIntervention}/${params.plantProject}/intervention`;
  const result = await fetchPostCall(uri, params);
  return result;
};

// Record (upload) a planned single-tree intervention that already exists on the server.
export const recordPlannedIntervention = async (projectId: string, interventionId: string, params: any) => {
  const uri = `${postUrlNewApi.recordPlannedIntervention}/${projectId}/intervention/${interventionId}/record`;
  const result = await fetchPutCall(uri, params);
  return result;
};


export const acceptEmailInvite = async (params: any) => {
  const uri = `${postUrlNewApi.acceptEmailInvite}`;
  const result = await fetchPostCall(uri, params);
  return result;
};

export const acceptLinkInvite = async (params: any) => {
  const uri = `${postUrlNewApi.acceptBulkInvite}`;
  const result = await fetchPostCall(uri, params);
  return result;
};

export const registerUserDevice = async (params: DeviceRegistrationParams) => {
  const uri = `${postUrlNewApi.registerDevice}`;
  const result = await fetchPostCall(uri, params);
  return result;
};

// Notification APIs
export const getNotifications = async (page: number = 1, limit: number = 20, type?: string) => {
  const queryParams = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
  if (type) {
    queryParams.append('type', type);
  }
  const uri = `${getUrlMobileApi.getNotifications}?${queryParams.toString()}`;
  const result = await fetchGetCall(uri, true);
  return result;
};

export const getUnreadNotificationCount = async () => {
  const uri = `${getUrlMobileApi.getUnreadNotificationCount}`;
  const result = await fetchGetCall(uri, true);
  return result;
};

export const markNotificationAsRead = async (uid: string) => {
  const uri = `${getUrlMobileApi.getNotifications}/${uid}/read`;
  const result = await fetchPatchCall(uri, {});
  return result;
};

export const markAllNotificationsAsRead = async () => {
  const uri = `${getUrlMobileApi.getNotifications}/mark-all-read`;
  const result = await fetchPatchCall(uri, {});
  return result;
};

export const submitFeedback = async (params: any) => {
  const uri = `${postUrlNewApi.submitFeedback}`;
  const result = await fetchPostCall(uri, params);
  return result;
};

export const uploadMonitoringPlot = async (projectUid: string, params: any) => {
  const uri = `${postUrlNewApi.monitoringPlot}/${projectUid}/upload`;
  const result = await fetchPostCall(uri, params);
  return result;
};

export const uploadPlotRemeasurement = async (projectUid: string, params: any) => {
  const uri = `${postUrlNewApi.monitoringPlot}/${projectUid}/remeasure`;
  const result = await fetchPostCall(uri, params);
  return result;
};

export const addPlotPlants = async (projectUid: string, params: any) => {
  const uri = `${postUrlNewApi.monitoringPlot}/${projectUid}/plants`;
  const result = await fetchPostCall(uri, params);
  return result;
};

export const addPlotObservations = async (projectUid: string, params: any) => {
  const uri = `${postUrlNewApi.monitoringPlot}/${projectUid}/observations`;
  const result = await fetchPostCall(uri, params);
  return result;
};

