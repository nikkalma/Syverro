package com.syverro.data.repository

import com.syverro.data.local.dao.PersonalBookDao
import com.syverro.data.local.mapper.PersonalBookMapper
import com.syverro.domain.model.PersonalBook
import com.syverro.domain.model.ReadingStatus
import com.syverro.domain.repository.PersonalBookRepository
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class RoomPersonalBookRepository @Inject constructor(
    private val personalBookDao: PersonalBookDao,
) : PersonalBookRepository {

    override fun getAll(): List<PersonalBook> {
        return personalBookDao.getAll().map(PersonalBookMapper::toDomain)
    }

    override fun getById(id: String): PersonalBook? {
        return personalBookDao.getById(id)?.let(PersonalBookMapper::toDomain)
    }

    override fun getByStatus(status: ReadingStatus): List<PersonalBook> {
        return personalBookDao.getByStatus(status.name).map(PersonalBookMapper::toDomain)
    }

    override fun search(query: String): List<PersonalBook> {
        return personalBookDao.search(query).map(PersonalBookMapper::toDomain)
    }

    override fun insert(book: PersonalBook) {
        personalBookDao.insert(PersonalBookMapper.toEntity(book))
    }

    override fun updateStatus(id: String, status: ReadingStatus) {
        personalBookDao.updateStatus(id, status.name, System.currentTimeMillis())
    }

    override fun updateProgress(id: String, progress: Float) {
        personalBookDao.updateProgress(id, progress, System.currentTimeMillis())
    }

    override fun reconcileCanonical(id: String, canonicalBookId: String) {
        personalBookDao.updateCanonicalBook(id, canonicalBookId, System.currentTimeMillis())
    }

    override fun delete(id: String) {
        personalBookDao.delete(id)
    }
}
