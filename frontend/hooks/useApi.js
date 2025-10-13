import { useQuery, useMutation, useQueryClient } from 'react-query';
import { toast } from 'react-hot-toast';

export const useApiQuery = (key, queryFn, options = {}) => {
  return useQuery(key, queryFn, {
    staleTime: 5 * 60 * 1000, // 5 minutos
    cacheTime: 10 * 60 * 1000, // 10 minutos
    refetchOnWindowFocus: false,
    ...options
  });
};

export const useApiMutation = (mutationFn, options = {}) => {
  const queryClient = useQueryClient();

  return useMutation(mutationFn, {
    onSuccess: (data, variables, context) => {
      if (options.successMessage) {
        toast.success(options.successMessage);
      }
      if (options.invalidateQueries) {
        options.invalidateQueries.forEach(key => {
          queryClient.invalidateQueries(key);
        });
      }
      if (options.onSuccess) {
        options.onSuccess(data, variables, context);
      }
    },
    onError: (error, variables, context) => {
      const message = error.response?.data?.message || 'Erro na operação';
      toast.error(message);

      if (options.onError) {
        options.onError(error, variables, context);
      }
    },
    ...options
  });
};

export default useApiQuery;