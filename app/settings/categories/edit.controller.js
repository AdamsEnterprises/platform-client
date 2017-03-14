module.exports = [
    '$scope',
    '$rootScope',
    '$translate',
    '$location',
    'RoleEndpoint',
    'TagEndpoint',
    'Notify',
    '_',
    'Util',
    '$routeParams',
    '$q',
function (
    $scope,
    $rootScope,
    $translate,
    $location,
    RoleEndpoint,
    TagEndpoint,
    Notify,
    _,
    Util,
    $routeParams,
    $q
) {

    // Redirect to home if not authorized
    if ($rootScope.hasManageSettingsPermission() === false) {
        return $location.path('/');
    }
    $scope.category = {};

    $q.all([TagEndpoint.getFresh({id: $routeParams.id}).$promise, TagEndpoint.query().$promise]).then(function (results) {
        $scope.category = results[0];
        $scope.parents = getParents(results[1]);
    });

    function getParents(tags) {
        var parents = [];
        tags.forEach(function (tag) {
            if (!tag.parent && tag.id !== $scope.category.id) {
                parents.push(tag);
            }
        });
        return parents;
    }

    $translate('tag.edit_tag').then(function (title) {
        $scope.title = title;
        $rootScope.$emit('setPageTitle', title);
    });
    // Change mode
    $scope.$emit('event:mode:change', 'settings');

    $scope.getParentName = function () {
        var parentName = 'Nothing';
        if ($scope.category.parent_id) {
            $scope.parents.forEach(function (parent) {
                if (parent.id === $scope.category.parent_id) {
                    parentName = parent.tag;
                }
            });
        } else if ($scope.category.parent) {
            parentName = $scope.category.parent.tag;
        }
        return parentName;
    };

    RoleEndpoint.query().$promise.then(function (roles) {
        $scope.roles = roles;
    });

    $scope.saving = false;

    $scope.saveCategory = function (tag) {
        console.log(tag);
        $scope.saving = true;
        //@todo: change this to use original api allowing callback on save and delete cache
        TagEndpoint.saveCache(tag).$promise.then(function (result) {
            Notify.notify('notify.category.save_success', {name: tag.tag});
            $location.path('/settings/categories');
        }, function (errorResponse) { // error
            Notify.apiErrors(errorResponse);
            $scope.saving = false;
        });
    };

    var handleResponseErrors = function (errorResponse) {
        Notify.apiErrors(errorResponse);
    };

    $scope.deleteCategory = function (category) {

        Notify.confirmDelete('notify.category.destroy_confirm').then(function () {
            TagEndpoint.delete({ id: category.id }).$promise.then(function () {
                Notify.notify('notify.category.destroy_success');
            }, handleResponseErrors);
            $location.url('/settings/categories');
        }, function () {});
    };

    $scope.cancel = function () {
        $location.path('/settings/categories');
    };
}];
