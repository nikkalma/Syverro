package com.syverro.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable

private val DarkColorScheme = darkColorScheme(
    background = DarkBackground,
    surface = DarkSurface,
    surfaceVariant = DarkSurfaceAlt,
    onBackground = DarkTextPrimary,
    onSurface = DarkTextPrimary,
    onSurfaceVariant = DarkTextSecondary,
    primary = DarkPrimary,
    onPrimary = DarkTextPrimary,
    secondary = DarkSuccess,
    onSecondary = DarkTextPrimary,
    tertiary = DarkAccent,
    onTertiary = DarkTextPrimary,
    error = DarkError,
    onError = DarkTextPrimary,
    outline = DarkBorder,
    outlineVariant = DarkBorder,
)

private val LightColorScheme = lightColorScheme(
    background = LightBackground,
    surface = LightSurface,
    surfaceVariant = LightSurfaceAlt,
    onBackground = LightTextPrimary,
    onSurface = LightTextPrimary,
    onSurfaceVariant = LightTextSecondary,
    primary = LightPrimary,
    onPrimary = LightTextPrimary,
    secondary = LightSuccess,
    onSecondary = LightTextPrimary,
    tertiary = LightAccent,
    onTertiary = LightTextPrimary,
    error = LightError,
    onError = LightTextPrimary,
    outline = LightBorder,
    outlineVariant = LightBorder,
)

@Composable
fun SyverroTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit
) {
    val colorScheme = if (darkTheme) DarkColorScheme else LightColorScheme

    MaterialTheme(
        colorScheme = colorScheme,
        typography = SyverroTypography,
        content = content,
    )
}