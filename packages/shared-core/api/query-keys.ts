export const queryKeys = {
  todos: ['todos'] as const,
  todosList: () => [...queryKeys.todos, 'list'] as const,
  todoDetail: (id: string) => [...queryKeys.todos, 'detail', id] as const,
} as const