[![GitHub Workflow Status (with event)](https://img.shields.io/github/actions/workflow/status/digi-serve/ab_service_process_manager/pr-merge-release.yml?logo=github&label=Build%20%26%20Test)](https://github.com/digi-serve/ab_service_process_manager/actions/workflows/pr-merge-release.yml)
[![GitHub tag (with filter)](https://img.shields.io/github/v/tag/digi-serve/ab_service_process_manager?logo=github&label=Latest%20Version)
](https://github.com/digi-serve/ab_service_process_manager/releases)
[![Docker Pulls](https://img.shields.io/docker/pulls/digiserve/ab-process-manager?logo=docker&logoColor=white&label=Docker%20Pulls)](https://hub.docker.com/r/digiserve/ab-process-manager)
[![Image Size](https://img.shields.io/docker/image-size/digiserve/ab-process-manager/master?logo=docker&logoColor=white&label=Image%20Size)](https://hub.docker.com/r/digiserve/ab-process-manager/tags)

# AppBuilder Service Process Manager
An AppBuilder service  to manage our process tasks.

## Install
See [ab_cli](https://github.com/digi-serve/ab-cli)

## Pull Requests
Pull Requests should be tagged with a label `major`, `minor` or `patch`. Use `major` for breaking changes, `minor` for new features, or `patch` for bug fixes. To merge without creating a release a `skip-release` tag can be added instead.

:pencil: In the pull request body add release notes between these tags:
```md
<!-- #release_notes -->

<!-- /release_notes --> 
```
Anything between those 2 lines will be used as release notes when creating a version.

### When merged:
 - A new version will be created using semantic versioning
 - The version will be updated in `package.json`
 - A new tag and release will be created on GitHub
 - A new docker image will be built, tagged with the version and published to dockerhub
 - A Workflow in `ab_runtime` will be triggered to update the service version file.

## Manually Building a Docker Image
It may be useful to build a custom docker image from a feature branch for testing.
This can be done through a workflow dispatch trigger.
1. Go to the Actions tab
2. Select the 'Docker Build Custom' workflow
3. Select 'run Workflow' and fill in the form
The image will be built from the selected branch and pushed to dockerhub using the given tags
