jQuery(document).ready(function ($) {
  $('.attractions__tab').on('click', function (e) {
    e.preventDefault();

    var $currentTab = $(this);
    var categoryId = $currentTab.data('tab');

    // Find the parent section to scope DOM queries
    var $section = $currentTab.closest('section');
    var $grid = $section.find('.attractions__grid');
    var $allTabs = $section.find('.attractions__tab');

    // Update active classes and aria attributes
    $allTabs.removeClass('--active').attr('aria-selected', 'false');
    $currentTab.addClass('--active').attr('aria-selected', 'true');

    // Add a simple loading state (optional visual feedback)
    $grid.css('opacity', '0.5');

    // Perform the AJAX request
    $.ajax({
      url: window.theme_data.ajax_url,
      type: 'POST',
      data: {
        action: 'handle_attractions_filter_ajax',
        category_id: categoryId,
      },
      success: function (response) {
        // Update the grid content with the server response
        $grid.html(response);
      },
      error: function (xhr, status, error) {
        console.error('AJAX Error:', error);
      },
      complete: function () {
        // Remove the loading state
        $grid.css('opacity', '1');
      }
    });
  });
});