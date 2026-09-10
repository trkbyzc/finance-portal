package com.financeportal.repository.base;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.repository.NoRepositoryBean;

// Spring'in bu interface'i somut bir repository olarak instantiate etmesini engeller; yalnızca kalıtım için kullanılır.
@NoRepositoryBean
public interface BaseRepository<T, ID> extends JpaRepository<T, ID> {
}