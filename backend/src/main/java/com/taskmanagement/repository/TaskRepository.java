package com.taskmanagement.repository;

import com.taskmanagement.entity.Task;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface TaskRepository extends JpaRepository<Task, Long> {
    Optional<Task> findTopByGenreOrderBySortOrderDesc(String genre);
}
