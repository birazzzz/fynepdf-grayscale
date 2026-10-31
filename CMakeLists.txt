cmake_minimum_required(VERSION 3.16)
project(fynepdf_grayscale
    VERSION 0.1.1
    DESCRIPTION "PDFs made gray in place: text stays text, nothing redrawn"
    HOMEPAGE_URL "https://github.com/fynepdf/fynepdf-grayscale"
    LANGUAGES CXX)

# Use it from another CMake project in any of three ways, each giving the target
# fynepdf::grayscale:
#   find_package(fynepdf_grayscale CONFIG REQUIRED)   after installing it (or through vcpkg.json)
#   FetchContent_Declare(fynepdf_grayscale GIT_REPOSITORY https://github.com/fynepdf/fynepdf-grayscale ...)
#   add_subdirectory(fynepdf-grayscale)
#
# It needs qpdf and a libjpeg API (libjpeg-turbo or MozJPEG); OpenJPEG (JPEG 2000 pictures) and
# Little CMS (ICC profiles) are optional. They are found on the system, or a project that builds
# its own names its targets in FYNEPDF_GRAYSCALE_QPDF_TARGET, FYNEPDF_GRAYSCALE_JPEG_TARGET,
# FYNEPDF_GRAYSCALE_OPENJPEG_TARGET and FYNEPDF_GRAYSCALE_LCMS_TARGET (empty for none).

set(FYNEPDF_GRAYSCALE_TOP_LEVEL OFF)
if(CMAKE_SOURCE_DIR STREQUAL PROJECT_SOURCE_DIR)
    set(FYNEPDF_GRAYSCALE_TOP_LEVEL ON)
endif()
option(FYNEPDF_GRAYSCALE_CLI "Build the fynepdf-grayscale command line" ${FYNEPDF_GRAYSCALE_TOP_LEVEL})
option(FYNEPDF_GRAYSCALE_TESTS "Build the tests (ctest)" OFF)

list(APPEND CMAKE_MODULE_PATH "${CMAKE_CURRENT_SOURCE_DIR}/cmake")

if(NOT CMAKE_CXX_STANDARD)
    set(CMAKE_CXX_STANDARD 17)
    set(CMAKE_CXX_STANDARD_REQUIRED ON)
endif()

add_library(fynepdf_grayscale STATIC
    src/colour.cpp
    src/grayscale.cpp
    src/icc.cpp
    src/jpeg.cpp
    src/jpx.cpp
    src/pdf_function.cpp)
add_library(fynepdf::grayscale ALIAS fynepdf_grayscale)
set_target_properties(fynepdf_grayscale PROPERTIES EXPORT_NAME grayscale OUTPUT_NAME fynepdf_grayscale)
target_compile_features(fynepdf_grayscale PUBLIC cxx_std_17)
target_include_directories(fynepdf_grayscale
    PUBLIC $<BUILD_INTERFACE:${CMAKE_CURRENT_SOURCE_DIR}/include> $<INSTALL_INTERFACE:include>
    PRIVATE src)
# qpdf without its old PointerHolder (std::shared_ptr only), as qpdf 11 and 12 recommend.
target_compile_definitions(fynepdf_grayscale PRIVATE POINTERHOLDER_TRANSITION=4)
if(WIN32)
    target_compile_definitions(fynepdf_grayscale PRIVATE NOMINMAX WIN32_LEAN_AND_MEAN)
endif()
if(MSVC)
    target_compile_options(fynepdf_grayscale PRIVATE /W4 /utf-8 /bigobj)
    target_compile_definitions(fynepdf_grayscale PRIVATE _CRT_SECURE_NO_WARNINGS)
else()
    target_compile_options(fynepdf_grayscale PRIVATE -Wall -Wextra)
endif()

# Installing (and find_package from the install) needs dependencies found here, not targets a
# parent project builds.
set(FYNEPDF_GRAYSCALE_CAN_INSTALL ON)
foreach(given QPDF JPEG OPENJPEG LCMS)
    if(FYNEPDF_GRAYSCALE_${given}_TARGET)
        set(FYNEPDF_GRAYSCALE_CAN_INSTALL OFF)
    endif()
endforeach()

if(NOT FYNEPDF_GRAYSCALE_QPDF_TARGET)
    find_package(qpdf CONFIG REQUIRED)
    set(FYNEPDF_GRAYSCALE_QPDF_TARGET qpdf::libqpdf)
    # A static qpdf (vcpkg's on Linux and macOS) names zlib and libjpeg bare, -lz -ljpeg: they
    # are found in its own folder.
    get_target_property(FYNEPDF_GRAYSCALE_QPDF_TYPE qpdf::libqpdf TYPE)
    if(FYNEPDF_GRAYSCALE_QPDF_TYPE STREQUAL "STATIC_LIBRARY")
        target_link_directories(fynepdf_grayscale PUBLIC $<BUILD_INTERFACE:$<TARGET_LINKER_FILE_DIR:qpdf::libqpdf>>)
    endif()
endif()
if(NOT FYNEPDF_GRAYSCALE_JPEG_TARGET)
    find_package(JPEG REQUIRED)
    set(FYNEPDF_GRAYSCALE_JPEG_TARGET JPEG::JPEG)
endif()
target_link_libraries(fynepdf_grayscale PUBLIC ${FYNEPDF_GRAYSCALE_QPDF_TARGET} PRIVATE ${FYNEPDF_GRAYSCALE_JPEG_TARGET})

set(FYNEPDF_GRAYSCALE_FOUND_OPENJPEG OFF)
if(NOT DEFINED FYNEPDF_GRAYSCALE_OPENJPEG_TARGET)
    find_package(OpenJPEG CONFIG QUIET)
    if(OpenJPEG_FOUND)
        set(FYNEPDF_GRAYSCALE_OPENJPEG_TARGET openjp2)
        set(FYNEPDF_GRAYSCALE_FOUND_OPENJPEG ON)
    endif()
endif()
if(FYNEPDF_GRAYSCALE_OPENJPEG_TARGET)
    target_link_libraries(fynepdf_grayscale PRIVATE ${FYNEPDF_GRAYSCALE_OPENJPEG_TARGET})
    target_compile_definitions(fynepdf_grayscale PRIVATE FYNEPDF_GRAYSCALE_WITH_OPENJPEG)
    message(STATUS "fynepdf-grayscale: JPEG 2000 through ${FYNEPDF_GRAYSCALE_OPENJPEG_TARGET}")
else()
    message(STATUS "fynepdf-grayscale: no OpenJPEG, JPEG 2000 pictures are drawn gray through the wrapper colour space")
endif()

set(FYNEPDF_GRAYSCALE_FOUND_LCMS OFF)
if(NOT DEFINED FYNEPDF_GRAYSCALE_LCMS_TARGET)
    find_package(LCMS2 QUIET)
    if(LCMS2_FOUND)
        set(FYNEPDF_GRAYSCALE_LCMS_TARGET LCMS2::LCMS2)
        set(FYNEPDF_GRAYSCALE_FOUND_LCMS ON)
    endif()
endif()
if(FYNEPDF_GRAYSCALE_LCMS_TARGET)
    target_link_libraries(fynepdf_grayscale PRIVATE ${FYNEPDF_GRAYSCALE_LCMS_TARGET})
    target_compile_definitions(fynepdf_grayscale PRIVATE FYNEPDF_GRAYSCALE_WITH_LCMS)
    message(STATUS "fynepdf-grayscale: ICC profiles through ${FYNEPDF_GRAYSCALE_LCMS_TARGET}")
else()
    message(STATUS "fynepdf-grayscale: no Little CMS, ICC-based colours by formula")
endif()

if(FYNEPDF_GRAYSCALE_CLI)
    add_executable(fynepdf-grayscale cli/main.cpp)
    target_link_libraries(fynepdf-grayscale PRIVATE fynepdf::grayscale)
    target_compile_definitions(fynepdf-grayscale PRIVATE FYNEPDF_GRAYSCALE_VERSION="${PROJECT_VERSION}")
endif()

if(FYNEPDF_GRAYSCALE_TESTS)
    enable_testing()
    add_subdirectory(tests)
endif()

set(FYNEPDF_GRAYSCALE_INSTALL_DEFAULT OFF)
if(FYNEPDF_GRAYSCALE_TOP_LEVEL AND FYNEPDF_GRAYSCALE_CAN_INSTALL)
    set(FYNEPDF_GRAYSCALE_INSTALL_DEFAULT ON)
endif()
option(FYNEPDF_GRAYSCALE_INSTALL "Install the library, headers and CMake package"
    ${FYNEPDF_GRAYSCALE_INSTALL_DEFAULT})
if(FYNEPDF_GRAYSCALE_INSTALL AND FYNEPDF_GRAYSCALE_CAN_INSTALL)
    include(GNUInstallDirs)
    include(CMakePackageConfigHelpers)
    set(FYNEPDF_GRAYSCALE_CMAKE_DIR "${CMAKE_INSTALL_LIBDIR}/cmake/fynepdf_grayscale")
    install(TARGETS fynepdf_grayscale EXPORT fynepdf_grayscaleTargets
        ARCHIVE DESTINATION ${CMAKE_INSTALL_LIBDIR})
    install(DIRECTORY include/ DESTINATION ${CMAKE_INSTALL_INCLUDEDIR})
    install(FILES LICENSE THIRD-PARTY-NOTICES.md DESTINATION ${CMAKE_INSTALL_DATADIR}/doc/fynepdf-grayscale)
    if(FYNEPDF_GRAYSCALE_CLI)
        install(TARGETS fynepdf-grayscale RUNTIME DESTINATION ${CMAKE_INSTALL_BINDIR})
    endif()
    install(EXPORT fynepdf_grayscaleTargets NAMESPACE fynepdf:: DESTINATION ${FYNEPDF_GRAYSCALE_CMAKE_DIR})
    configure_package_config_file(cmake/fynepdf_grayscaleConfig.cmake.in
        "${CMAKE_CURRENT_BINARY_DIR}/fynepdf_grayscaleConfig.cmake"
        INSTALL_DESTINATION ${FYNEPDF_GRAYSCALE_CMAKE_DIR})
    write_basic_package_version_file("${CMAKE_CURRENT_BINARY_DIR}/fynepdf_grayscaleConfigVersion.cmake"
        COMPATIBILITY SameMinorVersion)
    install(FILES
        "${CMAKE_CURRENT_BINARY_DIR}/fynepdf_grayscaleConfig.cmake"
        "${CMAKE_CURRENT_BINARY_DIR}/fynepdf_grayscaleConfigVersion.cmake"
        cmake/FindLCMS2.cmake
        DESTINATION ${FYNEPDF_GRAYSCALE_CMAKE_DIR})
endif()
