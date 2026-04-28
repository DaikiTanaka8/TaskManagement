package com.taskmanagement.dto;

import java.util.List;

public class ReorderRequest {

    private List<Item> items;

    public List<Item> getItems() { return items; }
    public void setItems(List<Item> items) { this.items = items; }

    public static class Item {
        private Long id;
        private int sortOrder;
        private String genre;

        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }

        public int getSortOrder() { return sortOrder; }
        public void setSortOrder(int sortOrder) { this.sortOrder = sortOrder; }

        public String getGenre() { return genre; }
        public void setGenre(String genre) { this.genre = genre; }
    }
}
