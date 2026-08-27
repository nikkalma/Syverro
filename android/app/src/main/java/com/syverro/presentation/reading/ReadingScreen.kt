package com.syverro.presentation.reading

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.syverro.R
import com.syverro.ui.theme.Spacing

@Composable
fun ReadingScreen(
    viewModel: ReadingViewModel = hiltViewModel(),
    onOpenReader: (String) -> Unit,
    onNavigateToLibrary: () -> Unit,
) {
    val state by viewModel.uiState.collectAsStateWithLifecycle()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(horizontal = 24.dp)
            .padding(top = 40.dp),
    ) {
        Text(
            text = stringResource(R.string.reading_title),
            style = MaterialTheme.typography.headlineLarge,
            color = MaterialTheme.colorScheme.onBackground,
        )

        Spacer(modifier = Modifier.height(Spacing.xxxl.dp))

        val book = state.activeBook
        if (book != null) {
            ContinueReadingCard(
                bookTitle = book.title,
                author = book.authorDisplay ?: "",
                progressPercent = state.progressPercent,
                documentAvailable = state.documentAvailable,
                activeSessionElapsed = state.activeSessionElapsed,
                onContinue = { onOpenReader(book.id) },
                onNavigateToLibrary = onNavigateToLibrary,
            )
        } else {
            EmptyReadingCard(onNavigateToLibrary = onNavigateToLibrary)
        }

        Spacer(modifier = Modifier.height(Spacing.xxl.dp))

        if (state.hasRecentActivity) {
            Text(
                text = stringResource(R.string.recent_activity),
                style = MaterialTheme.typography.labelMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
            Spacer(modifier = Modifier.height(Spacing.sm.dp))
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(
                    containerColor = MaterialTheme.colorScheme.surfaceVariant,
                ),
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(Spacing.lg.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                ) {
                    Column {
                        Text(
                            text = state.lastSessionDate,
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                        )
                        Text(
                            text = stringResource(R.plurals.books_in_progress, state.booksInProgress, state.booksInProgress),
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                        )
                    }
                    Text(
                        text = state.lastSessionDuration,
                        style = MaterialTheme.typography.titleMedium,
                        color = MaterialTheme.colorScheme.onSurface,
                    )
                }
            }
        } else {
            Text(
                text = stringResource(R.plurals.books_in_library, state.totalBooks, state.totalBooks),
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
        }
    }
}

@Composable
private fun ContinueReadingCard(
    bookTitle: String,
    author: String,
    progressPercent: Int,
    documentAvailable: Boolean,
    activeSessionElapsed: Long,
    onContinue: () -> Unit,
    onNavigateToLibrary: () -> Unit,
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surfaceVariant,
        ),
    ) {
        Column(modifier = Modifier.padding(Spacing.xl.dp)) {
            Text(
                text = stringResource(R.string.continue_reading_label),
                style = MaterialTheme.typography.labelMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
            Spacer(modifier = Modifier.height(Spacing.md.dp))

            Row(verticalAlignment = Alignment.CenterVertically) {
                Card(
                    modifier = Modifier.size(64.dp),
                    shape = MaterialTheme.shapes.small,
                    colors = CardDefaults.cardColors(
                        containerColor = MaterialTheme.colorScheme.primary.copy(alpha = 0.15f),
                    ),
                ) {
                    Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                        Text(
                            text = bookTitle.take(1).uppercase(),
                            style = MaterialTheme.typography.headlineMedium,
                            color = MaterialTheme.colorScheme.primary,
                        )
                    }
                }
                Spacer(modifier = Modifier.width(Spacing.lg.dp))
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = bookTitle,
                        style = MaterialTheme.typography.titleMedium,
                        color = MaterialTheme.colorScheme.onSurface,
                    )
                    Spacer(modifier = Modifier.height(2.dp))
                    Text(
                        text = author,
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                }
            }

            Spacer(modifier = Modifier.height(Spacing.md.dp))
            LinearProgressIndicator(
                progress = { progressPercent / 100f },
                modifier = Modifier.fillMaxWidth(),
                color = MaterialTheme.colorScheme.primary,
                trackColor = MaterialTheme.colorScheme.surface,
            )
            Spacer(modifier = Modifier.height(Spacing.xs.dp))
            Text(
                text = stringResource(R.string.reading_progress_percent, progressPercent),
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )

            if (activeSessionElapsed > 0) {
                Spacer(modifier = Modifier.height(Spacing.sm.dp))
                Text(
                    text = stringResource(R.string.last_session, formatElapsed(activeSessionElapsed)),
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }

            Spacer(modifier = Modifier.height(Spacing.lg.dp))

            if (documentAvailable) {
                Button(
                    onClick = onContinue,
                    colors = ButtonDefaults.buttonColors(
                        containerColor = MaterialTheme.colorScheme.primary,
                    ),
                    modifier = Modifier.fillMaxWidth(),
                ) {
                    Text(stringResource(R.string.continue_reading))
                }
            } else {
                Text(
                    text = stringResource(R.string.reading_file_unavailable),
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.error,
                )
                Spacer(modifier = Modifier.height(Spacing.sm.dp))
                OutlinedButton(
                    onClick = onNavigateToLibrary,
                    modifier = Modifier.fillMaxWidth(),
                ) {
                    Text(stringResource(R.string.go_to_library))
                }
            }
        }
    }
}

@Composable
private fun EmptyReadingCard(onNavigateToLibrary: () -> Unit) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surfaceVariant,
        ),
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(Spacing.xxxl.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            Spacer(modifier = Modifier.height(Spacing.xl.dp))
            Text(
                text = "\u2726",
                style = MaterialTheme.typography.displayMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
            Spacer(modifier = Modifier.height(Spacing.lg.dp))
            Text(
                text = stringResource(R.string.no_active_book),
                style = MaterialTheme.typography.titleLarge,
                color = MaterialTheme.colorScheme.onSurface,
            )
            Spacer(modifier = Modifier.height(Spacing.sm.dp))
            Text(
                text = stringResource(R.string.home_empty_description),
                style = MaterialTheme.typography.bodyLarge,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                textAlign = TextAlign.Center,
            )
            Spacer(modifier = Modifier.height(Spacing.xxl.dp))
            Button(
                onClick = onNavigateToLibrary,
                colors = ButtonDefaults.buttonColors(
                    containerColor = MaterialTheme.colorScheme.primary,
                ),
            ) {
                Text(stringResource(R.string.go_to_library))
            }
            Spacer(modifier = Modifier.height(Spacing.xl.dp))
        }
    }
}

@Composable
private fun formatElapsed(seconds: Long): String {
    val m = seconds / 60
    val s = seconds % 60
    return stringResource(R.string.duration_format, m, s)
}
