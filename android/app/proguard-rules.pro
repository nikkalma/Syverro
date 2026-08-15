# Syverro ProGuard rules
-keepattributes *Annotation*
-keep class com.syverro.** { *; }
-dontwarn kotlinx.serialization.**

# Readium toolkit (readium-streamer / readium-shared)
-keep class org.readium.r2.** { *; }
-dontwarn org.readium.r2.**