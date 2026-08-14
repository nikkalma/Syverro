package com.syverro.presentation.library

import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.syverro.R
import com.syverro.domain.model.Book
import com.syverro.domain.model.ReadingStatus
import com.syverro.ui.theme.Spacing

@Composable
fun LibraryScreen(
    viewModel: LibraryViewModel = hiltViewModel(),
    onBookSelected: (String) -> Unit,
) {
    val state by viewModel.uiState.collectAsStateWithLifecycle()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(horizontal = 24.dp)
            .padding(top = 40.dp),
    ) {
        Text(
            text = stringResource(R.string.library_title),
            style = MaterialTheme.typography.headlineLarge,
            color = MaterialTheme.colorScheme.onBackground,
        )

        Spacer(modifier = Modifier.height(Spacing.xl.dp))

        Row(
            modifier = Modifier
                .fillMaxWidth()
                .horizontalScroll(rememberScrollState()),
            horizontalArrangement = Arrangement.spacedBy(Spacing.sm.dp),
        ) {
            FilterChip(
                selected = state.filter == null,
                onClick = { viewModel.onEvent(LibraryEvent.FilterByStatus(null)) },
                label = { Text(stringResource(R.string.filter_all)) },
                shape = MaterialTheme.shapes.small,
            )
            FilterChip(
                selected = state.filter == ReadingStatus.READING,
                onClick = { viewModel.onEvent(LibraryEvent.FilterByStatus(ReadingStatus.READING)) },
                label = { Text(stringResource(R.string.filter_reading)) },
                shape = MaterialTheme.shapes.small,
            )
            FilterChip(
                selected = state.filter == ReadingStatus.FINISHED,
                onClick = { viewModel.onEvent(LibraryEvent.FilterByStatus(ReadingStatus.FINISHED)) },
                label = { Text(stringResource(R.string.filter_finished)) },
                shape = MaterialTheme.shapes.small,
            )
            FilterChip(
                selected = state.filter == ReadingStatus.PLANNED,
                onClick = { viewModel.onEvent(LibraryEvent.FilterByStatus(ReadingStatus.PLANNED)) },
                label = { Text(stringResource(R.string.filter_planned)) },
                shape = MaterialTheme.shapes.small,
            )
        }

        Spacer(modifier = Modifier.height(Spacing.xl.dp))

        val books = state.books
        if (books.isEmpty()) {
            Box(
                modifier = Modifier.fillMaxWidth().weight(1f),
                contentAlignment = Alignment.Center,
            ) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text(
                        text = "\u229E",
                        style = MaterialTheme.typography.displayMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                    Spacer(modifier = Modifier.height(Spacing.lg.dp))
                    Text(
                        text = stringResource(R.string.empty_library),
                        style = MaterialTheme.typography.titleLarge,
                        color = MaterialTheme.colorScheme.onSurface,
                    )
                    Spacer(modifier = Modifier.height(Spacing.sm.dp))
                    Text(
                        text = stringResource(R.string.empty_library_filter),
                        style = MaterialTheme.typography.bodyLarge,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        textAlign = TextAlign.Center,
                    )
                }
            }
        } else {
            LazyVerticalGrid(
                columns = GridCells.Fixed(3),
                horizontalArrangement = Arrangement.spacedBy(Spacing.md.dp),
                verticalArrangement = Arrangement.spacedBy(Spacing.lg.dp),
                modifier = Modifier.fillMaxWidth().weight(1f),
            ) {
                items(books, key = { it.id }) { book ->
                    BookCard(book = book, onClick = { onBookSelected(book.id) })
                }
            }
        }
    }
}

@Composable
private fun BookCard(book: Book, onClick: () -> Unit) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .aspectRatio(3f / 4f),
            shape = MaterialTheme.shapes.medium,
            colors = CardDefaults.cardColors(
                containerColor = MaterialTheme.colorScheme.surfaceVariant,
            ),
        ) {
            Box(
                modifier = Modifier.fillMaxSize(),
                contentAlignment = Alignment.Center,
            ) {
                Text(
                    text = book.title.take(1).uppercase(),
                    style = MaterialTheme.typography.headlineMedium,
                    color = MaterialTheme.colorScheme.primary.copy(alpha = 0.6f),
                )
            }
        }

        Spacer(modifier = Modifier.height(Spacing.sm.dp))

        Text(
            text = book.title,
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurface,
            maxLines = 2,
            overflow = TextOverflow.Ellipsis,
            textAlign = TextAlign.Center,
        )

        Spacer(modifier = Modifier.height(2.dp))

        Text(
            text = statusLabel(book.readingStatus),
            style = MaterialTheme.typography.labelSmall,
            color = statusColor(book.readingStatus),
        )
    }
}

@Composable
private fun statusLabel(status: ReadingStatus): String = when (status) {
    ReadingStatus.READING -> stringResource(R.string.filter_reading)
    ReadingStatus.FINISHED -> stringResource(R.string.filter_finished)
    ReadingStatus.PLANNED -> stringResource(R.string.filter_planned)
}

@Composable
private fun statusColor(status: ReadingStatus) = when (status) {
    ReadingStatus.READING -> MaterialTheme.colorScheme.primary
    ReadingStatus.FINISHED -> MaterialTheme.colorScheme.secondary
    ReadingStatus.PLANNED -> MaterialTheme.colorScheme.onSurfaceVariant
}
