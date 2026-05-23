import api from './api';

export const adminMovieApi = {
    getMoviesPaged: (params) => api.get('/movies/paged', { params }),
    createMovie: (data) => api.post('/movies', data),
    updateMovie: (id, data) => api.put(`/movies/${id}`, data),
    deleteMovie: (id) => api.delete(`/movies/${id}`),
    publishMovie: (id, status) => api.post(`/movies/${id}/publish?status=${status}`),
};
