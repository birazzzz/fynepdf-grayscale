# ctest: every file in fixtures/ (made for these tests: one PDF problem each, and exports from
# Chrome, LibreOffice and LaTeX) made grey, whole, first page only, and each kind of content
# alone.
add_executable(fynepdf_grayscale_smoke smoke.cpp)
target_link_libraries(fynepdf_grayscale_smoke PRIVATE fynepdf::grayscale)
target_compile_definitions(fynepdf_grayscale_smoke PRIVATE POINTERHOLDER_TRANSITION=4)
add_test(NAME grayscale
    COMMAND fynepdf_grayscale_smoke ${CMAKE_CURRENT_SOURCE_DIR}/fixtures ${CMAKE_CURRENT_BINARY_DIR}/out)
