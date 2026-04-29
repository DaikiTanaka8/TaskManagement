package com.taskmanagement.service;

import com.taskmanagement.dto.ReorderRequest;
import com.taskmanagement.dto.TaskRequest;
import com.taskmanagement.entity.Task;
import com.taskmanagement.repository.TaskRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class TaskService {

    private final TaskRepository taskRepository;

    public TaskService(TaskRepository taskRepository) {
        this.taskRepository = taskRepository;
    }

    public List<Task> findAll() {
        return taskRepository.findAll();
    }

    public Task create(TaskRequest request) {
        Task task = new Task();
        task.setTitle(request.getTitle());
        task.setMemo(request.getMemo());
        task.setDueDate(request.getDueDate());
        task.setGenre(request.getGenre());
        int maxSortOrder = taskRepository.findTopByGenreOrderBySortOrderDesc(request.getGenre())
                .map(Task::getSortOrder)
                .orElse(-1);
        task.setSortOrder(maxSortOrder + 1);
        return taskRepository.save(task);
    }

    public Task update(Long id, Task updated) {
        Task task = taskRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Task not found: " + id));
        task.setTitle(updated.getTitle());
        task.setMemo(updated.getMemo());
        task.setDueDate(updated.getDueDate());
        task.setGenre(updated.getGenre());
        task.setSortOrder(updated.getSortOrder());
        return taskRepository.save(task);
    }

    public void delete(Long id) {
        taskRepository.deleteById(id);
    }

    public Task toggleComplete(Long id) {
        Task task = taskRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Task not found: " + id));
        task.setCompleted(!task.isCompleted());
        return taskRepository.save(task);
    }

    @Transactional
    public void reorder(ReorderRequest request) {
        for (ReorderRequest.Item item : request.getItems()) {
            Task task = taskRepository.findById(item.getId())
                    .orElseThrow(() -> new RuntimeException("Task not found: " + item.getId()));
            task.setSortOrder(item.getSortOrder());
            task.setGenre(item.getGenre());
            taskRepository.save(task);
        }
    }
}
