#!/usr/bin/env bash
#
# Creates the area paths and sprint iterations that azure-devops-backlog.csv references.
#
# Run this BEFORE importing the CSV. The import validates Area Path and Iteration Path
# against paths that already exist and will not create them, so every one of the 271 rows
# fails if this has not been done.
#
# Iteration start and finish dates cannot travel in a CSV at all. They are set here, and
# they matter: Azure Boards will not render a burndown or a velocity chart for an iteration
# with no dates on it, so the sprint evidence for the report simply would not exist.
#
# Requires the Azure CLI with the devops extension, and Project Administrator rights:
#   az extension add --name azure-devops
#   az devops login
#
# Usage:
#   ./azure-devops-setup.sh [organisation-url] [project] [team]
#
# The organisation is ONLY the account segment of the URL, for example
# https://dev.azure.com/ijeomac. Everything after that is the project and belongs in the
# second argument, unencoded: pass "7003SCN Advanced Software Developmet Group 2", not
# "7003SCN%20Advanced%20...". Passing the project URL as the organisation is why an
# otherwise valid token is rejected at login.
#
set -euo pipefail

ORG="${1:-https://dev.azure.com/ijeomac}"
PROJECT="${2:-7003SCN Advanced Software Developmet Group 2}"
TEAM="${3:-$PROJECT Team}"

az devops configure --defaults organization="$ORG" project="$PROJECT"

echo "==> Area paths"
# The five disciplines the backlog is filtered by. Contribution per member is evidenced by
# filtering the board on these, so they have to match the CSV exactly.
# "Data and ML" rather than "Data & ML": Azure DevOps rejects an ampersand in a
# classification node name (TF50316), so the area silently never existed and every work item
# referencing it failed the import.
for AREA in "Backend" "Frontend" "Data and ML" "QA" "DevOps"; do
  echo "  $AREA"
  az boards area project create --name "$AREA" --output none 2>/dev/null \
    || echo "    already exists, skipping"
  # An area path exists at project level but does not appear on a team's board until the
  # team subscribes to it. Skipping this leaves the paths invisible where they are used.
  az boards area team add --team "$TEAM" --path "\\$PROJECT\\Area\\$AREA" --output none 2>/dev/null \
    || echo "    already on the team, skipping"
done

echo "==> Iterations"
# Four sprints spanning 20 July to 15 August 2026: three of seven days and a final six-day
# sprint closing on the submission date.
create_sprint () {
  local NAME="$1" START="$2" FINISH="$3"
  echo "  $NAME  $START to $FINISH"

  # Create, and fall back to update when it already exists. This matters more than it looks:
  # a new Azure DevOps project ships with Sprint 1 to Sprint 6 already defined and with NO
  # dates on them, so `create` fails, and a script that only creates leaves the sprints
  # dateless. A dateless iteration renders no burndown and no velocity chart at all, which
  # is the whole reason for setting them here.
  az boards iteration project create \
    --name "$NAME" --start-date "$START" --finish-date "$FINISH" --output none 2>/dev/null \
    || az boards iteration project update --path "\\$PROJECT\\Iteration\\$NAME" \
         --start-date "$START" --finish-date "$FINISH" --output none

  # An iteration is invisible on the backlog until the team subscribes to it. The identifier
  # is read from the node tree rather than a flat list, because `iteration project list`
  # returns the root node with its children nested, not an array.
  local ID
  ID="$(az boards iteration project list --output json \
        | python3 -c "import sys,json;d=json.load(sys.stdin);print(next((c['identifier'] for c in (d.get('children') or []) if c['name']=='$NAME'),''))")"
  if [ -n "$ID" ]; then
    az boards iteration team add --team "$TEAM" --id "$ID" --output none 2>/dev/null \
      || echo "    already on the team, skipping"
  else
    echo "    could not resolve the iteration id, add it to the team by hand"
  fi
}

create_sprint "Sprint 1" 2026-07-20 2026-07-26
create_sprint "Sprint 2" 2026-07-27 2026-08-02
create_sprint "Sprint 3" 2026-08-03 2026-08-09
create_sprint "Sprint 4" 2026-08-10 2026-08-15

echo
echo "Done. Verify under Project Settings > Project configuration, then import"
echo "docs/azure-devops-backlog.csv from Boards > Work Items > Import Work Items."
