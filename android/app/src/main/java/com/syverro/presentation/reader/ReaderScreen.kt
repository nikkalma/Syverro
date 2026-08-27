package com.syverro.presentation.reader

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.Button
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.dp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.fragment.app.FragmentActivity
import androidx.fragment.app.FragmentContainerView
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleEventObserver
import androidx.lifecycle.compose.LocalLifecycleOwner
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.syverro.R
import com.syverro.data.reader.ReaderUnavailableReason
import org.readium.r2.navigator.epub.EpubNavigatorFactory
import org.readium.r2.navigator.epub.EpubNavigatorFragment

private const val NAVIGATOR_TAG = "epub-navigator"

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ReaderScreen(
    bookId: String?,
    viewModel: ReaderViewModel = hiltViewModel(),
    onBack: () -> Unit,
) {
    val state by viewModel.uiState.collectAsStateWithLifecycle()

    LaunchedEffect(bookId) {
        if (bookId != null) viewModel.open(bookId)
    }

    val lifecycleOwner = LocalLifecycleOwner.current
    DisposableEffect(lifecycleOwner) {
        val observer = LifecycleEventObserver { _, event ->
            if (event == Lifecycle.Event.ON_PAUSE || event == Lifecycle.Event.ON_STOP) {
                viewModel.flush()
            }
        }
        lifecycleOwner.lifecycle.addObserver(observer)
        onDispose { lifecycleOwner.lifecycle.removeObserver(observer) }
    }

    val ready = state as? ReaderUiState.Ready

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        text = ready?.book?.title ?: stringResource(R.string.reader_title),
                        style = MaterialTheme.typography.titleLarge,
                    )
                },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(
                            imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                            contentDescription = stringResource(R.string.back),
                        )
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.surface,
                    titleContentColor = MaterialTheme.colorScheme.onSurface,
                ),
            )
        },
    ) { innerPadding ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding),
        ) {
            when (val s = state) {
                is ReaderUiState.Loading -> LoadingContent()
                is ReaderUiState.Error -> ErrorContent(error = s, onBack = onBack)
                is ReaderUiState.Ready -> ReaderNavigatorHost(
                    state = s,
                    viewModel = viewModel,
                    modifier = Modifier.fillMaxSize(),
                )
            }
        }
    }
}

@Composable
private fun LoadingContent() {
    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
        CircularProgressIndicator()
    }
}

@Composable
private fun ErrorContent(error: ReaderUiState.Error, onBack: () -> Unit) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(horizontal = 24.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center,
    ) {
        Text(
            text = stringResource(R.string.reader_error_title),
            style = MaterialTheme.typography.titleLarge,
            color = MaterialTheme.colorScheme.onSurface,
        )
        Spacer(modifier = Modifier.height(8.dp))
        Text(
            text = errorMessage(error.reason),
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )
        Spacer(modifier = Modifier.height(24.dp))
        Button(
            onClick = onBack,
            colors = androidx.compose.material3.ButtonDefaults.buttonColors(
                containerColor = MaterialTheme.colorScheme.primary,
            ),
        ) {
            Text(stringResource(R.string.back))
        }
    }
}

@Composable
private fun errorMessage(reason: ReaderUnavailableReason): String = when (reason) {
    ReaderUnavailableReason.BOOK_NOT_FOUND -> stringResource(R.string.reader_error_book_not_found)
    ReaderUnavailableReason.NO_DOCUMENT -> stringResource(R.string.reader_error_no_document)
    ReaderUnavailableReason.DOCUMENT_UNAVAILABLE -> stringResource(R.string.reader_error_unavailable)
    ReaderUnavailableReason.FILE_MISSING -> stringResource(R.string.reader_error_file_missing)
    ReaderUnavailableReason.UNSUPPORTED_FORMAT -> stringResource(R.string.reader_error_unsupported)
    ReaderUnavailableReason.OPEN_FAILED -> stringResource(R.string.reader_error_open_failed)
}

/**
 * Hosts the Readium [EpubNavigatorFragment] for a ready publication and forwards location changes
 * to the [ReaderViewModel] for throttled persistence.
 */
@Composable
private fun ReaderNavigatorHost(
    state: ReaderUiState.Ready,
    viewModel: ReaderViewModel,
    modifier: Modifier = Modifier,
) {
    val context = LocalContext.current
    val fragmentManager = (context as? FragmentActivity)?.supportFragmentManager

    var navigatorFragment by remember { mutableStateOf<EpubNavigatorFragment?>(null) }

    AndroidView(
        factory = { ctx ->
            FragmentContainerView(ctx).apply {
                id = R.id.reader_navigator_container
            }
        },
        update = { container ->
            val fm = fragmentManager ?: return@AndroidView
            if (fm.findFragmentByTag(NAVIGATOR_TAG) == null) {
                fm.fragmentFactory = EpubNavigatorFactory(state.publication).createFragmentFactory(
                    initialLocator = state.initialLocator,
                    listener = null,
                )
                fm.beginTransaction()
                    .add(R.id.reader_navigator_container, EpubNavigatorFragment::class.java, null, NAVIGATOR_TAG)
                    .commitNow()
            }
            navigatorFragment = fm.findFragmentByTag(NAVIGATOR_TAG) as? EpubNavigatorFragment
        },
        modifier = modifier,
    )

    LaunchedEffect(navigatorFragment) {
        navigatorFragment?.currentLocator?.collect { viewModel.onLocator(it) }
    }
}
