package com.taskmanagement.dto;

import jakarta.validation.constraints.NotBlank;

import java.time.LocalDate;

public class TaskRequest {

    @NotBlank(message = "タイトルは必須です")
    private String title;

    private String memo;

    private LocalDate dueDate;

    private String genre;

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getMemo() { return memo; }
    public void setMemo(String memo) { this.memo = memo; }

    public LocalDate getDueDate() { return dueDate; }
    public void setDueDate(LocalDate dueDate) { this.dueDate = dueDate; }

    public String getGenre() { return genre; }
    public void setGenre(String genre) { this.genre = genre; }
}
