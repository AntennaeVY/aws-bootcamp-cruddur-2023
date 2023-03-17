#!/bin/bash -e

CYAN='\033[1;36m'
NO_COLOR='\033[0m'
LABEL="updating security group rule..."
printf "${CYAN}== ${LABEL}${NO_COLOR}\n"

GITPOD_IP=$(curl -s ifconfig.me)

aws ec2 modify-security-group-rules \
    --group-id $DB_SG_ID \
    --security-group-rules "SecurityGroupRuleId=$DB_SG_RULE_ID,SecurityGroupRule={Description=GITPOD,IpProtocol=tcp,FromPort=5432,ToPort=5432,CidrIpv4=$GITPOD_IP/32}"
