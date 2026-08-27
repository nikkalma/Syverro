package com.syverro.presentation.bookdetail

import android.content.Intent
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.dp
import androidx.compose.ui.window.Dialog
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.syverro.R
import com.syverro.domain.model.ReadingStatus
import com.syverro.presentation.library.UriPermissionTaker
import com.syverro.ui.theme.Spacing

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun BookDetailScreen(
    bookId: String,
    viewModel: BookDetailViewModel = hiltViewModel(),
    onOpenReader: (String) -> Unit,
    onBack: () -> Unit,
) {
    val state by viewModel.uiState.collectAsStateWithLifecycle()
    val context = LocalContext.current

    val uriPermissionTaker = remember {
        UriPermissionTaker { uri ->
            context.contentResolver.takePersistableUriPermission(uri, Intent.FLAG_GRANT_READ_URI_PERMISSION)
        }
    }

    val importLauncher = rememberLauncherForActivityResult(
        ActivityResultContracts.OpenDocument(),
    ) { uri ->
        if (uri != null) {
            uriPermissionTaker.takePersistableReadPermission(uri)
            viewModel.importEpub(uri)
        }
    }

    LaunchedEffect(bookId) {
        viewModel.loadBook(bookId)
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(state.book?.title ?: "", style = MaterialTheme.typography.titleLarge) },
                navigationIcon = {
                    TextButton(onClick = onBack) {
                        Text("\u2190 Back", color = MaterialTheme.colorScheme.primary)
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.background,
                    titleContentColor = MaterialTheme.colorScheme.onBackground,
                ),
            )
        },
    ) { innerPadding ->
        val book = state.book
        if (book == null) {
            Box(
                modifier = Modifier.fillMaxSize().padding(innerPadding),
                contentAlignment = Alignment.Center,
            ) {
                Text(
                    text = "Book not found",
                    style = MaterialTheme.typography.bodyLarge,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
        } else {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(innerPadding)
                    .padding(horizontal = 24.dp),
            ) {
                Spacer(modifier = Modifier.height(Spacing.lg.dp))

                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = MaterialTheme.shapes.medium,
                    colors = CardDefaults.cardColors(
                        containerColor = MaterialTheme.colorScheme.surfaceVariant,
                    ),
                ) {
                    Column(modifier = Modifier.padding(Spacing.xxl.dp)) {
                        Card(
                            modifier = Modifier
                                .width(120.dp)
                                .aspectRatio(3f / 4f),
                            shape = MaterialTheme.shapes.small,
                            colors = CardDefaults.cardColors(
                                containerColor = MaterialTheme.colorScheme.primary.copy(alpha = 0.12f),
                            ),
                        ) {
                            Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                                Text(
                                    text = book.title.take(1).uppercase(),
                                    style = MaterialTheme.typography.displayMedium,
                                    color = MaterialTheme.colorScheme.primary,
                                )
                            }
                        }

                        Spacer(modifier = Modifier.height(Spacing.xl.dp))

                        Text(
                            text = book.title,
                            style = MaterialTheme.typography.headlineMedium,
                            color = MaterialTheme.colorScheme.onSurface,
                        )
                        Spacer(modifier = Modifier.height(Spacing.xs.dp))
                        Text(
                            text = book.authorDisplay ?: "",
                            style = MaterialTheme.typography.bodyLarge,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                        )
                        Spacer(modifier = Modifier.height(Spacing.sm.dp))

                        val statusLabel = when (book.readingStatus) {
                            ReadingStatus.READING -> stringResource(R.string.filter_reading)
                            ReadingStatus.FINISHED -> stringResource(R.string.filter_finished)
                            ReadingStatus.PLANNED -> stringResource(R.string.filter_planned)
                            ReadingStatus.REREADING -> stringResource(R.string.filter_rereading)
                            ReadingStatus.POSTPONED -> stringResource(R.string.filter_postponed)
                            ReadingStatus.ABANDONED -> stringResource(R.string.filter_abandoned)
                        }
                        Text(
                            text = statusLabel,
                            style = MaterialTheme.typography.labelMedium,
                            color = MaterialTheme.colorScheme.primary,
                        )
                    }
                }

                Spacer(modifier = Modifier.height(Spacing.xxl.dp))

                if (state.documentAvailable) {
                    Button(
                        onClick = {
                            if (!state.hasActiveSession) viewModel.startReading()
                            onOpenReader(book.id)
                        },
                        enabled = !state.isImporting,
                        colors = ButtonDefaults.buttonColors(
                            containerColor = MaterialTheme.colorScheme.primary,
                        ),
                        modifier = Modifier.fillMaxWidth(),
                        shape = MaterialTheme.shapes.small,
                    ) {
                        Text(stringResource(R.string.read_book))
                    }
                } else {
                    Text(
                        text = stringResource(R.string.reading_file_unavailable),
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.error,
                    )
                    Spacer(modifier = Modifier.height(Spacing.sm.dp))
                    Button(
                        onClick = {
                            importLauncher.launch(arrayOf("application/epub+zip", "application/octet-stream"))
                        },
                        enabled = !state.isImporting,
                        colors = ButtonDefaults.buttonColors(
                            containerColor = MaterialTheme.colorScheme.primary,
                        ),
                        modifier = Modifier.fillMaxWidth(),
                        shape = MaterialTheme.shapes.small,
                    ) {
                        Text(
                            text = stringResource(
                                if (state.isImporting) R.string.importing else R.string.import_epub,
                            ),
                        )
                    }
                }

                if (state.importError) {
                    Spacer(modifier = Modifier.height(Spacing.sm.dp))
                    Text(
                        text = stringResource(R.string.import_failed),
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.error,
                    )
                }

                Spacer(modifier = Modifier.height(Spacing.sm.dp))

                if (book.readingStatus == ReadingStatus.READING) {
                    OutlinedButton(
                        onClick = { viewModel.startFinishConfirm() },
                        modifier = Modifier.fillMaxWidth(),
                        shape = MaterialTheme.shapes.small,
                    ) {
                        Text("Mark as finished")
                    }
                }
            }

            if (state.showFinishConfirm) {
                AlertDialog(
                    onDismissRequest = { viewModel.dismissFinishConfirm() },
                    title = { Text("Mark as finished?") },
                    text = { Text("This will close the current reading session.") },
                    confirmButton = {
                        TextButton(onClick = { viewModel.markFinished() }) {
                            Text("Yes, mark finished")
                        }
                    },
                    dismissButton = {
                        TextButton(onClick = { viewModel.dismissFinishConfirm() }) {
                            Text("Cancel")
                        }
                    },
                )
            }
        }
    }
}
