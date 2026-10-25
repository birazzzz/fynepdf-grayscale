# A project using fynepdf-grayscale: builds examples/gray.cpp against it.
#   cmake -S examples -B build/example && cmake --build build/example
cmake_minimum_required(VERSION 3.16)
project(fynepdf_grayscale_example LANGUAGES CXX)

include(FetchContent)
FetchContent_Declare(fynepdf_grayscale
    GIT_REPOSITORY https://github.com/birazzzz/fynepdf-grayscale.git
    GIT_TAG v0.1.0)
# Or, from an installed copy (or vcpkg): find_package(fynepdf_grayscale CONFIG REQUIRED)
FetchContent_MakeAvailable(fynepdf_grayscale)

add_executable(gray gray.cpp)
target_link_libraries(gray PRIVATE fynepdf::grayscale)
