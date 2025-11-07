export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
}

export const createResponse = <T>(data: T, message?: string): ApiResponse<T> => ({
  success: true,
  message,
  data,
});

export const createErrorResponse = (message: string): ApiResponse<null> => ({
  success: false,
  message,
  data: null,
});


