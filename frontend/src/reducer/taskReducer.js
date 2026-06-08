export const initialState = {
  tasks: [],
  currentTask: null,
  loading: false,
  error: null,
  filters: {
    status: '',
    priority: '',
    search: '',
  },
};

export const taskReducer = (state, action) => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    
    case 'SET_TASKS':
      return { ...state, tasks: action.payload, loading: false };
    
    case 'SET_CURRENT_TASK':
      return { ...state, currentTask: action.payload };
    
    case 'ADD_TASK':
      return { ...state, tasks: [action.payload, ...state.tasks] };
    
    case 'UPDATE_TASK':
      return {
        ...state,
        tasks: state.tasks.map(task =>
          task._id === action.payload._id ? action.payload : task
        ),
        currentTask: state.currentTask?._id === action.payload._id ? action.payload : state.currentTask,
      };
    
    case 'DELETE_TASK':
      return {
        ...state,
        tasks: state.tasks.filter(task => task._id !== action.payload),
        currentTask: state.currentTask?._id === action.payload ? null : state.currentTask,
      };
    
    case 'SET_FILTER':
      return {
        ...state,
        filters: { ...state.filters, [action.payload.key]: action.payload.value },
      };
    
    case 'CLEAR_FILTERS':
      return { ...state, filters: initialState.filters };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    
    default:
      return state;
  }
};