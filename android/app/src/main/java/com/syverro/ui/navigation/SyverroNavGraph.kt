package com.syverro.ui.navigation

import androidx.annotation.StringRes
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.AutoStories
import androidx.compose.material.icons.outlined.EditNote
import androidx.compose.material.icons.outlined.LibraryBooks
import androidx.compose.material.icons.outlined.Person
import androidx.compose.material.icons.rounded.AutoStories
import androidx.compose.material.icons.rounded.EditNote
import androidx.compose.material.icons.rounded.LibraryBooks
import androidx.compose.material.icons.rounded.Person
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.NavigationBarItemDefaults
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.stringResource
import androidx.navigation.NavDestination.Companion.hierarchy
import androidx.navigation.NavGraph.Companion.findStartDestination
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import com.syverro.R
import com.syverro.presentation.bookdetail.BookDetailScreen
import com.syverro.presentation.library.LibraryScreen
import com.syverro.presentation.notes.NotesScreen
import com.syverro.presentation.profile.ProfileScreen
import com.syverro.presentation.reader.ReaderActivity
import com.syverro.presentation.reading.ReadingScreen
import com.syverro.presentation.settings.SettingsScreen

private data class Tab(
    val route: String,
    @StringRes val labelRes: Int,
    val icon: ImageVector,
    val selectedIcon: ImageVector,
)

private val tabs = listOf(
    Tab("reading", R.string.reading, Icons.Outlined.AutoStories, Icons.Rounded.AutoStories),
    Tab("library", R.string.library, Icons.Outlined.LibraryBooks, Icons.Rounded.LibraryBooks),
    Tab("notes", R.string.notes, Icons.Outlined.EditNote, Icons.Rounded.EditNote),
    Tab("me", R.string.me, Icons.Outlined.Person, Icons.Rounded.Person),
)

private val tabRoutes = tabs.map { it.route }.toSet()

@Composable
fun SyverroNavGraph() {
    val navController = rememberNavController()
    val context = LocalContext.current
    val navBackStackEntry by navController.currentBackStackEntryAsState()
    val currentDestination = navBackStackEntry?.destination

    val showBottomBar = currentDestination?.route in tabRoutes

    Scaffold(
        bottomBar = {
            if (showBottomBar) {
                NavigationBar(
                    containerColor = MaterialTheme.colorScheme.surface,
                ) {
                    tabs.forEach { tab ->
                        val selected = currentDestination?.hierarchy?.any { it.route == tab.route } == true
                        NavigationBarItem(
                            selected = selected,
                            onClick = {
                                navController.navigate(tab.route) {
                                    popUpTo(navController.graph.findStartDestination().id) {
                                        saveState = true
                                    }
                                    launchSingleTop = true
                                    restoreState = true
                                }
                            },
                            icon = {
                                Icon(
                                    imageVector = if (selected) tab.selectedIcon else tab.icon,
                                    contentDescription = stringResource(tab.labelRes),
                                )
                            },
                            label = {
                                Text(
                                    text = stringResource(tab.labelRes),
                                    style = MaterialTheme.typography.labelMedium,
                                )
                            },
                            colors = NavigationBarItemDefaults.colors(
                                selectedIconColor = MaterialTheme.colorScheme.primary,
                                selectedTextColor = MaterialTheme.colorScheme.primary,
                                unselectedIconColor = MaterialTheme.colorScheme.onSurfaceVariant,
                                unselectedTextColor = MaterialTheme.colorScheme.onSurfaceVariant,
                                indicatorColor = MaterialTheme.colorScheme.surfaceVariant,
                            ),
                        )
                    }
                }
            }
        },
    ) { innerPadding ->
        NavHost(
            navController = navController,
            startDestination = "reading",
            modifier = Modifier.padding(innerPadding),
        ) {
            composable("reading") {
                ReadingScreen(
                    onOpenReader = { bookId ->
                        context.startActivity(ReaderActivity.intent(context, bookId))
                    },
                    onNavigateToLibrary = { navController.navigate("library") },
                )
            }
            composable("library") {
                LibraryScreen(
                    onOpenReader = { bookId ->
                        context.startActivity(ReaderActivity.intent(context, bookId))
                    },
                    onOpenDetail = { bookId -> navController.navigate("book/$bookId") },
                )
            }
            composable("notes") {
                NotesScreen()
            }
            composable("me") {
                ProfileScreen(
                    onOpenSettings = { navController.navigate("settings") },
                )
            }
            composable(
                route = "book/{bookId}",
                arguments = listOf(navArgument("bookId") { type = NavType.StringType }),
            ) { backStackEntry ->
                val bookId = backStackEntry.arguments?.getString("bookId") ?: return@composable
                BookDetailScreen(
                    bookId = bookId,
                    onOpenReader = { id ->
                        context.startActivity(ReaderActivity.intent(context, id))
                    },
                    onBack = { navController.popBackStack() },
                )
            }
            composable("settings") {
                SettingsScreen(
                    onBack = { navController.popBackStack() },
                )
            }
        }
    }
}
